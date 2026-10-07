import { readFile } from "node:fs/promises";
import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { authenticatedFixture as fixture } from "./fixtures/authenticated";

test.use({ trace: "off" });

const credentials = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  },
  restricted: {
    email: process.env.E2E_RESTRICTED_EMAIL,
    password: process.env.E2E_RESTRICTED_PASSWORD,
  },
};

const mailboxPath = process.env.E2E_MAILBOX_PATH;

async function latestMailLink(email: string, requestedAt: number) {
  try {
    const messages = (await readFile(mailboxPath!, "utf8")).trim().split("\n").filter(Boolean)
      .map((line) => JSON.parse(line) as { to: string; text: string; createdAt: string })
      .filter((message) => message.to === email && new Date(message.createdAt).getTime() >= requestedAt);
    return messages.at(-1)?.text.match(/https?:\/\/[^\s]+/)?.[0];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

type CapturedAction = {
  url: string;
  fields: Array<[string, string]>;
};

async function signIn(page: Page, identity: keyof typeof credentials) {
  const account = credentials[identity];
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(account.email!);
  await page.getByLabel("Contraseña").fill(account.password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
}

async function captureAction(form: Locator): Promise<CapturedAction> {
  return form.evaluate((element) => {
    const htmlForm = element as HTMLFormElement;
    return {
      url: htmlForm.action || window.location.href,
      fields: Array.from(new FormData(htmlForm).entries()).map(([name, value]) => [name, String(value)]),
    };
  });
}

async function invokeActionDirectly(context: BrowserContext, action: CapturedAction) {
  const origin = new URL(action.url).origin;
  return context.request.post(action.url, {
    failOnStatusCode: false,
    maxRedirects: 0,
    headers: { origin, referer: action.url },
    multipart: Object.fromEntries(action.fields),
  });
}

function submission(page: Page, name: string) {
  return page.locator("article.data-list__expanded").filter({ hasText: name });
}

test.describe("authenticated backoffice @authenticated", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    const missing = Object.entries({
      E2E_ADMIN_EMAIL: credentials.admin.email,
      E2E_ADMIN_PASSWORD: credentials.admin.password,
      E2E_RESTRICTED_EMAIL: credentials.restricted.email,
      E2E_RESTRICTED_PASSWORD: credentials.restricted.password,
      E2E_MAILBOX_PATH: mailboxPath,
    }).filter(([, value]) => !value).map(([name]) => name);
    if (missing.length) {
      throw new Error(`Authenticated E2E fixture is mandatory; missing ${missing.join(", ")}`);
    }
  });

  test("blocks admin without a session", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Operación antes que espectáculo.");
    await context.close();
  });

  test("enforces real administrator and project-manager permissions on reads and mutations", async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const adminErrors: string[] = [];
    adminPage.on("console", (message) => { if (message.type() === "error") adminErrors.push(message.text()); });
    adminPage.on("pageerror", (error) => adminErrors.push(error.message));

    await signIn(adminPage, "admin");
    await expect(adminPage.getByRole("heading", { level: 1 })).toHaveText("Project Control Center");
    const projectRow = adminPage.locator(".control-table__row").filter({ hasText: fixture.projectName });
    await expect(projectRow, "The mandatory synthetic project fixture is missing").toHaveCount(1);
    await projectRow.getByRole("link", { name: /Abrir/ }).click();
    await expect(adminPage).toHaveURL(new RegExp(`/admin/projects/${fixture.projectId}$`));
    await expect(adminPage.getByRole("heading", { level: 1 })).toHaveText(fixture.projectName);
    await expect(adminPage.getByText("Guardar no publica.")).toBeVisible();

    await adminPage.goto("/admin/contacts");
    await expect(adminPage.getByRole("heading", { level: 1 })).toHaveText("Contextos recibidos.");
    const statusSubmission = submission(adminPage, fixture.statusSubmissionName);
    const retrySubmission = submission(adminPage, fixture.retrySubmissionName);
    await expect(statusSubmission, "The mandatory status submission fixture is missing").toHaveCount(1);
    await expect(retrySubmission, "The mandatory retry submission fixture is missing").toHaveCount(1);
    const statusAction = await captureAction(statusSubmission.locator("form").filter({ hasText: "Guardar" }));
    const retryAction = await captureAction(retrySubmission.locator("form").filter({ hasText: "Reintentar notificación" }));

    const anonymousContext = await browser.newContext();
    for (const action of [statusAction, retryAction]) {
      const response = await invokeActionDirectly(anonymousContext, action);
      expect(response.ok(), "An anonymous direct Server Action invocation must be rejected").toBe(false);
    }
    await anonymousContext.close();

    const restrictedContext = await browser.newContext();
    const restrictedPage = await restrictedContext.newPage();
    await signIn(restrictedPage, "restricted");
    const deniedProject = await restrictedContext.request.get(`/admin/projects/${fixture.projectId}`, { failOnStatusCode: false, maxRedirects: 0 });
    expect(deniedProject.ok(), "An unassigned project manager must not read the synthetic project").toBe(false);
    expect(await deniedProject.text()).not.toContain(fixture.projectName);
    const deniedContacts = await restrictedContext.request.get("/admin/contacts", { failOnStatusCode: false, maxRedirects: 0 });
    expect(deniedContacts.ok(), "A project manager must not read administrator-only contact submissions").toBe(false);
    expect(await deniedContacts.text()).not.toContain(fixture.statusSubmissionName);
    expect(await deniedContacts.text()).not.toContain(fixture.retrySubmissionName);
    for (const action of [statusAction, retryAction]) {
      const response = await invokeActionDirectly(restrictedContext, action);
      expect(response.ok(), "A project manager direct Server Action invocation must be rejected").toBe(false);
    }
    await restrictedContext.close();

    await adminPage.reload();
    await expect(submission(adminPage, fixture.statusSubmissionName)).toContainText("NEW");
    await expect(submission(adminPage, fixture.retrySubmissionName)).toContainText("Notificación: FAILED");
    await expect(submission(adminPage, fixture.retrySubmissionName)).toContainText("Intentos: 0");

    const authorizedStatus = submission(adminPage, fixture.statusSubmissionName);
    await authorizedStatus.locator('select[name="status"]').selectOption("REVIEWED");
    await authorizedStatus.getByRole("button", { name: "Guardar" }).click();
    await expect(submission(adminPage, fixture.statusSubmissionName)).toContainText("REVIEWED");

    await submission(adminPage, fixture.retrySubmissionName).getByRole("button", { name: "Reintentar notificación" }).click();
    await expect(submission(adminPage, fixture.retrySubmissionName)).toContainText("Notificación: SENT");
    await expect(submission(adminPage, fixture.retrySubmissionName)).toContainText("Intentos: 1");

    expect(adminErrors).toEqual([]);
    await adminContext.close();
  });

  test("delivers, consumes, and prevents reuse of a client invitation", async ({ browser }) => {
    const inviteeEmail = "invited.portal@syntavera.invalid";
    const requestedAt = Date.now() - 1_000;
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await signIn(adminPage, "admin");
    await adminPage.goto(`/admin/projects/${fixture.projectId}`);
    const invitationForm = adminPage.locator("form").filter({ has: adminPage.getByRole("heading", { name: "Invitar cliente" }) });
    await invitationForm.getByLabel("Nombre").fill("Cliente invitado sintético");
    await invitationForm.getByLabel("Email").fill(inviteeEmail);
    await invitationForm.getByRole("button", { name: "Enviar invitación" }).click();
    await expect(adminPage).toHaveURL(new RegExp(`/admin/projects/${fixture.projectId}\\?invite=sent`));
    await expect(adminPage.getByRole("status")).toContainText("Invitación enviada");
    await expect(adminPage.locator("#client-access")).toContainText("Invitación enviada");

    let invitationUrl: string | undefined;
    await expect.poll(async () => {
      invitationUrl = await latestMailLink(inviteeEmail, requestedAt);
      return Boolean(invitationUrl);
    }).toBe(true);

    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await clientPage.goto(invitationUrl!);
    await expect(clientPage.getByRole("heading", { level: 1 })).toHaveText("Activa tu acceso privado.");
    const activationRequestedAt = Date.now() - 1_000;
    await clientPage.getByRole("button", { name: "Aceptar invitación y enviar acceso" }).click();
    await expect(clientPage).toHaveURL(/\/login\?sent=1$/);

    let magicUrl: string | undefined;
    await expect.poll(async () => {
      const candidate = await latestMailLink(inviteeEmail, activationRequestedAt);
      magicUrl = candidate && candidate !== invitationUrl ? candidate : undefined;
      return Boolean(magicUrl);
    }).toBe(true);
    await clientPage.goto(magicUrl!);
    await expect(clientPage).toHaveURL(/\/portal$/);
    await expect(clientPage.getByText(fixture.projectName)).toBeVisible();

    await clientPage.goto(invitationUrl!);
    await expect(clientPage.getByRole("heading", { level: 1 })).toHaveText("Este enlace ya no está disponible.");
    await clientContext.close();
    await adminContext.close();
  });
});
