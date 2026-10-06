import { expect, test } from "@playwright/test";

const routes = [
  { name: "home", path: "/" },
  { name: "labs", path: "/labs" },
  { name: "how-we-work", path: "/how-we-work" },
  { name: "about", path: "/about" },
  { name: "contact", path: "/contact" },
] as const;

for (const route of routes) {
  test(`${route.name} visual reference`, async ({ page }) => {
    const clientErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") clientErrors.push(message.text());
    });
    page.on("pageerror", (error) => clientErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The committed development-mode references include Next's portal. Warm it
    // before the reload so the first route is compared in the same UI state.
    await expect(page.locator("nextjs-portal")).toHaveCount(1);
    await page.waitForTimeout(1_000);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator("html").evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe("auto");
    await expect(page).toHaveScreenshot(`${route.name}.png`, { animations: "disabled" });
    expect(clientErrors).toEqual([]);
  });
}
