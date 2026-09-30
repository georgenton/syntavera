import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), "browser console and page errors").toEqual([]);
});

test("home exposes the approved public structure", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Convertimos problemas reales");
  await expect(page.getByRole("link", { name: "Insights" })).toHaveCount(0);
  await expect(page.getByText("FeelVerse", { exact: true })).toBeVisible();
  await expect(page.getByText(/venture independiente/i).first()).toBeVisible();
});

test("capabilities uses the permanent canonical redirect", async ({ page }) => {
  const response = await page.goto("/capabilities");
  const redirectedFrom = response?.request().redirectedFrom();
  expect((await redirectedFrom?.response())?.status()).toBe(308);
  expect(page.url()).toContain("/how-we-work#capabilities");
  await expect(page.locator("#capabilities")).toBeVisible();
});

test("incomplete cases are noindex and absent from sitemap", async ({ page, request }) => {
  await page.goto("/labs/drillops");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText("Caso en revisión editorial")).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/labs/drillops");
  expect(sitemap).not.toContain("/admin");
});

test("unknown lab cases return a real 404", async ({ page }) => {
  const response = await page.goto("/labs/no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Esta página no existe." })).toBeVisible();
  const errors = browserErrors.get(page) ?? [];
  expect(errors).toEqual(["Failed to load resource: the server responded with a status of 404 (Not Found)"]);
  errors.length = 0;
});

test("contact exposes the privacy gate and server-ready form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cuéntanos el problema");
  await expect(page.getByRole("link", { name: "aviso de privacidad" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar contexto →" })).toBeVisible();
  await page.getByRole("button", { name: "Enviar contexto →" }).click();
  await expect(page.getByText("Revisa los campos indicados.", { exact: true })).toBeVisible();
  await expect(page.getByText("Escribe tu nombre.")).toBeVisible();
});
