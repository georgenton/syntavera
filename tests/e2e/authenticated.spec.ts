import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("authenticated backoffice @authenticated", () => {
  test.skip(!email || !password, "Requires the explicit isolated-database E2E administrator");

  test("blocks admin without a session", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Operación antes que espectáculo.");
    await context.close();
  });

  test("signs in and opens the relational project workspace", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Project Control Center");
    const firstProject = page.locator(".control-table__row a").first();
    if (await firstProject.count()) {
      await firstProject.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Guardar no publica.")).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
