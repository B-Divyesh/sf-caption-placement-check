import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";

test("landing is accessible and routes to the checker", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Caption Placement Check/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
  await page.getByRole("link", { name: "Try the browser checker" }).click();
  await expect(page.getByRole("heading", { name: "Catch captions that cover what matters." })).toBeVisible();
});

test("checker exposes keyboard-operable local inputs", async ({ page }) => {
  await page.goto("/check/");
  await expect(page.locator("h1")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to checker" })).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
});

test("mobile layout keeps primary actions visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Download for/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Try the browser checker" })).toBeVisible();
});

test("runs a local video and caption scan end to end", async ({ page }) => {
  await page.goto("/check/");
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await expect(page.getByRole("button", { name: /Scan caption cues/ })).toBeEnabled();
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
});
