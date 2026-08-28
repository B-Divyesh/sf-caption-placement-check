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
  await page.getByRole("link", { name: "Check your own files" }).click();
  await expect(page.getByRole("heading", { name: "Catch captions that cover what matters." })).toBeVisible();
});

test("@claim:sample-demo opens a local sample review without saving data", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("demo:") || key.startsWith("cpc:") || key.startsWith("sb_license:")).length)).toBe(0);
});

test("@claim:media-local keeps the sample review on this site", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/");
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173")).toBeTruthy();
});

test("@claim:offline-demo reloads the shipped demo after its first visit", async ({ page, context }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => failed.push(request.url()));
  await page.goto("/");
  await page.evaluate(async () => {
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()));
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  });
  errors.length = 0;
  failed.length = 0;
  await page.goto("/demo/");
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await expect.poll(() => page.locator("html").getAttribute("data-offline-ready")).toBe("true");
  expect(await page.evaluate(async () => {
    const cache = await caches.open("caption-placement-check-v3");
    const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[rel=stylesheet][href]")]
      .map((element) => "src" in element && element.src ? element.src : (element as HTMLLinkElement).href);
    return Promise.all(assets.map(async (asset) => Boolean(await cache.match(asset))));
  })).toEqual([true, true]);
  await context.setOffline(true);
  await page.reload();
  expect(page.url()).toContain("/demo/");
  expect(errors, `failed requests: ${failed.join(", ")}`).toEqual([]);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await context.setOffline(false);
});

test("release fallback has no console error when metadata is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.locator("#release-status")).toBeVisible();
  expect(errors).toEqual([]);
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
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
});

test("@claim:local-scan runs a local video and caption scan end to end", async ({ page }) => {
  await page.goto("/check/");
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await expect(page.getByRole("button", { name: /Scan caption cues/ })).toBeEnabled();
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await expect((await download).suggestedFilename()).toBe("caption-placement-findings.csv");
});
