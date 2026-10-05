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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Convertimos conocimiento experto en software e IA para tu operación");
  await expect(page.getByRole("link", { name: "Insights" })).toHaveCount(0);
  await expect(page.getByText("FeelVerse", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Inteligencia aplicada para decisiones reales", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Conoce cómo trabajamos/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar capacidades" }).first()).toBeVisible();
});

test("capabilities uses the permanent canonical redirect", async ({ page }) => {
  const response = await page.goto("/capabilities");
  const redirectedFrom = response?.request().redirectedFrom();
  expect((await redirectedFrom?.response())?.status()).toBe(308);
  expect(page.url()).toContain("/how-we-work#capabilities");
  await expect(page.locator("#capabilities")).toBeVisible();
});

test("admin remains protected from an anonymous browser", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
});

test("incomplete cases are noindex and absent from sitemap", async ({ page, request }) => {
  await page.goto("/labs/drillops");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText("Reunir señales, cálculos y referencias técnicas sin perder el rastro de cómo se llega a una recomendación operacional.")).toBeVisible();
  await expect(page.getByText(/por completar|placeholder|fuera del sitemap/i)).toHaveCount(0);
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

test("contact blocks collection before every gate is ready", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cuéntanos el problema");
  await expect(page.getByRole("heading", { level: 2, name: "Estamos habilitando nuestro canal de contacto. Mientras tanto, puedes conocer cómo trabajamos" })).toBeVisible();
  await expect(page.locator("form.contact-form")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("public metadata keeps canonical URLs and sitemap boundaries", async ({ page, request }) => {
  await page.goto("/about");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://syntavera.dev/about");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://syntavera.dev/contact");
  expect(sitemap).not.toContain("/labs/drillops");
  expect(sitemap).not.toContain("/admin");
});

test("labs and about keep their public evidence boundaries", async ({ page }) => {
  await page.goto("/labs");
  await expect(page.getByText("Ficha de capacidad", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Co-desarrollo", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Validación comercial", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Candidato a piloto", { exact: true }).first()).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);

  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 2, name: "Jorge Quizamanchuro" })).toBeVisible();
  await expect(page.getByText("FeelVerse", { exact: true })).toBeVisible();
  await expect(page.getByText(/no es producto ni cliente de SyntaVera/i)).toBeVisible();
});

test("public calls to action resolve and no assistant is exposed", async ({ page, request }) => {
  for (const path of ["/", "/labs", "/about", "/contact"]) {
    await page.goto(path);
    await expect(page.locator("[data-assistant], [data-chat-widget]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /asistente|chat/i })).toHaveCount(0);

    const hrefs = await page.locator("a.button").evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter(Boolean));
    for (const href of new Set(hrefs)) {
      expect(href, `CTA without an internal destination on ${path}`).toMatch(/^\//);
      const response = await request.get(href!);
      expect(response.status(), `Broken CTA ${href} on ${path}`).toBeLessThan(400);
    }
  }
});
