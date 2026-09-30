import { expect, test } from "@playwright/test";

test.skip(Boolean(process.env.CI), "Visual baselines are captured locally from the approved handoff environment");

test("home visual reference", async ({ page }) => {
  const clientErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") clientErrors.push(message.text());
  });
  page.on("pageerror", (error) => clientErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe("auto");
  await expect(page).toHaveScreenshot("home.png", { fullPage: true, animations: "disabled" });
  expect(clientErrors).toEqual([]);
});
