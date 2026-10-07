import { readFile } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { authenticatedFixture as fixture } from "./fixtures/authenticated";

test.use({ trace: "off" });
test.describe.configure({ mode: "serial" });

const mailboxPath = process.env.E2E_MAILBOX_PATH;

function requirePortalFixture() {
  if (!mailboxPath) throw new Error("Portal E2E requires E2E_MAILBOX_PATH");
}

async function latestMagicLink(email: string, requestedAt: number) {
  try {
    const lines = (await readFile(mailboxPath!, "utf8")).trim().split("\n").filter(Boolean);
    const messages = lines.map((line) => JSON.parse(line) as { to: string; text: string; createdAt: string })
      .filter((message) => message.to === email && new Date(message.createdAt).getTime() >= requestedAt);
    return messages.at(-1)?.text.match(/https?:\/\/[^\s]+/)?.[0];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function signInClient(page: Page, email: string) {
  requirePortalFixture();
  const requestedAt = Date.now() - 1_000;
  await page.goto("/login");
  await page.getByLabel("Email invitado").fill(email);
  await page.getByRole("button", { name: "Enviar enlace de acceso" }).click();
  await expect(page.getByRole("status")).toContainText("recibirás un enlace");
  let url: string | undefined;
  await expect.poll(async () => {
    url = await latestMagicLink(email, requestedAt);
    return Boolean(url);
  }, { timeout: 15_000 }).toBe(true);
  await page.goto(url!);
  await expect(page).toHaveURL(/\/portal$/);
}

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "desktop-1440", "Functional portal flow runs once on the pinned desktop browser");
}

function collectClientErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("VIEW client sees only published non-financial data @portal", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await signInClient(page, fixture.viewerEmail);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Visora");
  await expect(page.getByText("Facturas con saldo")).toHaveCount(0);
  await expect(page.getByText(fixture.invoiceNumber)).toHaveCount(0);
  await expect(page.getByText(fixture.projectName)).toBeVisible();
  await expect(page.getByText("Proyecto pendiente de publicación")).toBeVisible();

  await page.goto(`/portal/p/${fixture.projectId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(fixture.projectName);
  await expect(page.getByRole("navigation", { name: "Portal del proyecto" }).getByText("Facturación")).toHaveCount(0);
  await expect(page.getByText("Facturas visibles")).toHaveCount(0);
  await expect(page.getByText("Aprobaciones pendientes")).toHaveCount(0);
  await expect(page.getByText(fixture.publishedDeliverableTitle)).toBeVisible();
  await expect(page.getByText(fixture.draftDeliverableTitle)).toHaveCount(0);
  await page.goto(`/portal/p/${fixture.projectId}/docs/${fixture.documentId}`);
  await expect(page.getByRole("link", { name: "Revisar aceptación" })).toHaveCount(0);
  const deniedAcceptance = await page.goto(`/portal/p/${fixture.projectId}/docs/${fixture.documentId}/accept`);
  expect(deniedAcceptance?.status()).toBe(404);

  await page.goto(`/portal/p/${fixture.projectId}/support`);
  await expect(page.getByText("Ticket visible sintético")).toBeVisible();
  await expect(page.getByText("Ticket cerrado sintético")).toBeVisible();
  await expect(page.getByText("TICKET INTERNO NO VISIBLE")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Nuevo ticket" })).toHaveCount(0);
  await page.goto(`/portal/p/${fixture.projectId}/support/${fixture.visibleTicketId}`);
  await expect(page.getByText("Mensaje visible del cliente sintético.")).toBeVisible();
  await expect(page.getByText(fixture.internalMessage)).toHaveCount(0);
  await expect(page.getByLabel("Responder")).toHaveCount(0);

  const deniedBilling = await page.goto(`/portal/p/${fixture.projectId}/billing`);
  expect(deniedBilling?.status()).toBe(404);
  await expect(page.getByText(fixture.invoiceNumber)).toHaveCount(0);
  const deniedForeign = await page.goto(`/portal/p/${fixture.foreignProjectId}`);
  expect(deniedForeign?.status()).toBe(404);
  await expect(page.getByText(fixture.foreignProjectName)).toHaveCount(0);

  await page.goto(`/portal/p/${fixture.unpublishedProjectId}`);
  await expect(page.getByText("Aún no hay una vista publicada.")).toBeVisible();
  expect(errors.filter((error) => !error.includes("404 (Not Found)"))).toEqual([]);
});

test("COMMENT client creates and replies to visible support tickets @portal", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await signInClient(page, fixture.collaboratorEmail);
  await page.goto(`/portal/p/${fixture.projectId}/support/new`);
  await page.getByLabel("Asunto").fill("Bloqueo sintético creado por E2E");
  await page.getByLabel("Contexto").fill("Contexto sintético suficiente para validar la creación del ticket.");
  await page.getByLabel("Hito relacionado").selectOption(fixture.milestoneId);
  await page.getByRole("button", { name: "Crear ticket" }).click();
  await expect(page).toHaveURL(new RegExp(`/portal/p/${fixture.projectId}/support/[0-9a-f-]+$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bloqueo sintético creado por E2E");
  await page.getByLabel("Responder").fill("Respuesta sintética del cliente para el historial.");
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(page.getByText("Respuesta sintética del cliente para el historial.")).toBeVisible();

  await page.goto(`/portal/p/${fixture.projectId}/support/${fixture.closedTicketId}`);
  await expect(page.getByText("Conversación visible ya cerrada.")).toBeVisible();
  await expect(page.getByLabel("Responder")).toHaveCount(0);
  const deniedAcceptance = await page.goto(`/portal/p/${fixture.projectId}/docs/${fixture.documentId}/accept`);
  expect(deniedAcceptance?.status()).toBe(404);
  expect(errors.filter((error) => !error.includes("404 (Not Found)"))).toEqual([]);
});

test("APPROVE and FINANCE client sees billing and records exact-version acceptance once @portal", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await signInClient(page, fixture.approverEmail);
  await expect(page.getByText("Facturas con saldo")).toBeVisible();
  await page.goto(`/portal/p/${fixture.projectId}`);
  await expect(page.getByRole("navigation", { name: "Portal del proyecto" }).getByText("Facturación")).toBeVisible();
  await page.goto(`/portal/p/${fixture.projectId}/billing`);
  await expect(page.getByText(`Factura ${fixture.invoiceNumber}`)).toBeVisible();

  await page.goto(`/portal/p/${fixture.projectId}/docs/${fixture.documentId}`);
  await page.getByRole("link", { name: "Revisar aceptación" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Registrar aceptación" }).click();
  await expect(page.getByRole("status")).toContainText("Aceptación ya registrada");
  await expect(page.getByRole("button", { name: "Registrar aceptación" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Aceptación ya registrada");
  expect(errors).toEqual([]);
});

test("client can close and re-establish a real session @portal", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await signInClient(page, fixture.viewerEmail);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/portal");
  await expect(page).toHaveURL(/\/login\?next=%2Fportal$/);
  await signInClient(page, fixture.viewerEmail);
  await expect(page).toHaveURL(/\/portal$/);
});

test("critical portal pages fit the configured viewport @portal-responsive", async ({ page }) => {
  const errors = collectClientErrors(page);
  await signInClient(page, fixture.approverEmail);
  for (const path of ["/portal", `/portal/p/${fixture.projectId}`, `/portal/p/${fixture.projectId}/docs`, `/portal/p/${fixture.projectId}/docs/${fixture.documentId}/accept`, `/portal/p/${fixture.projectId}/deliverables`, `/portal/p/${fixture.projectId}/billing`, `/portal/p/${fixture.projectId}/activity`, `/portal/p/${fixture.projectId}/support`]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `Unexpected document overflow on ${path}`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  expect(errors).toEqual([]);
});
