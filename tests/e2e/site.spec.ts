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

test("@claim:sample-demo opens a useful local sample review without saving data", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page).toHaveTitle("Demo — Caption Placement Check");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled · 2 cues need a closer look", { timeout: 15_000 });
  await expect(page.locator("#findings li")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("demo:") || key.startsWith("cpc:") || key.startsWith("sb_license:")).length)).toBe(0);
});

test("@claim:media-local processes selected media without uploads", async ({ page }) => {
  const requests: Array<{ url: string; method: string; postData: string | null }> = [];
  page.on("request", (request) => requests.push({ url: request.url(), method: request.method(), postData: request.postData() }));
  await page.goto("/demo/");
  await page.getByRole("link", { name: "Start for real" }).click();
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  expect(requests.every((request) => new URL(request.url).origin === "http://127.0.0.1:4173")).toBeTruthy();
  expect(requests.filter((request) => request.method !== "GET" || request.postData).map((request) => request.url)).toEqual([]);
});

test("@claim:no-account completes a free sample scan and CSV export", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeEnabled();
  await expect(page.locator("input[type=password], input[autocomplete=username]")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await expect(await download).toBeTruthy();
});

test("@claim:saved-regions-local saves a protected region only in browser storage", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/");
  await page.getByRole("link", { name: "Start for real" }).click();
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Save protected regions" }).click();
  await expect(page.getByText(/protected region.+saved for future checks/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cpc:protected-regions"))).not.toBeNull();
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173")).toBeTruthy();
});

test("@claim:no-tracking uses no third-party requests", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const route of ["/", "/demo/", "/check/", "/privacy/", "/terms/"]) await page.goto(route);
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173")).toBeTruthy();
});

test("@claim:offline-demo reloads the shipped demo after its first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()));
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  });
  await page.goto("/demo/");
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await expect.poll(() => page.locator("html").getAttribute("data-offline-ready")).toBe("true");
  expect(await page.evaluate(async () => {
    const cache = await caches.open("caption-placement-check-v7");
    const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[rel=stylesheet][href]")]
      .map((element) => "src" in element && element.src ? element.src : (element as HTMLLinkElement).href);
    return Promise.all(assets.map(async (asset) => Boolean(await cache.match(asset))));
  })).toEqual([true, true]);
  await context.setOffline(true);
  await page.reload();
  expect(page.url()).toContain("/demo/");
  await expect(page).toHaveTitle("Demo — Caption Placement Check", { timeout: 15_000 });
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#findings li")).toHaveCount(2);
  await context.setOffline(false);
});

test("release fallback has no console error when metadata is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.locator("#release-status")).toBeVisible();
  expect(errors).toEqual([]);
});

test("checker exposes keyboard-operable local inputs and protected-region marking", async ({ page }) => {
  await page.goto("/check/");
  await expect(page.locator("h1")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to checker" })).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await expect(page.locator("#overlay")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#scan-summary")).toContainText("2 cues need a closer look");
});

test("populated demo has a clean landmark tree at desktop and mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo/");
    await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 15_000 });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ["serious", "critical", "moderate"].includes(issue.impact || ""))).toEqual([]);
  }
});

test("mobile layout keeps primary actions and legal links accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Choose a Linux build|Download for Linux/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
  for (const route of ["/privacy/", "/terms/"]) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: "Caption Placement Check home" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
  }
});

test("@claim:local-scan exports the demo review as a complete CSV", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 15_000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const result = await download;
  const csv = await result.createReadStream();
  let content = "";
  for await (const chunk of csv!) content += chunk.toString();
  expect(result.suggestedFilename()).toBe("caption-placement-findings.csv");
  expect(content.split("\n")).toHaveLength(3);
  expect(content).toContain("start,end,reason,confidence_percent,caption,recommendation,status");
});

test("@claim:caption-formats scans SRT and positioned WebVTT", async ({ page }) => {
  for (const captions of ["tests/fixtures/sample.srt", "tests/fixtures/sample.vtt"]) {
    await page.goto("/check/");
    await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
    await page.locator("#caption-file").setInputFiles(resolve(captions));
    await page.getByRole("button", { name: /Scan caption cues/ }).click();
    await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  }
});

test("@claim:local-detection flags shipped portrait and dense-media overlap fixtures", async ({ page }) => {
  for (const media of ["cpc-01.webm", "cpc-13.webm"]) {
    await page.goto("/check/");
    await page.locator("#video-file").setInputFiles(resolve("tests/benchmark/media", media));
    await page.locator("#caption-file").setInputFiles(resolve("tests/benchmark/critical.srt"));
    await page.getByRole("button", { name: /Scan caption cues/ }).click();
    await expect(page.locator("#findings li")).toHaveCount(1, { timeout: 20_000 });
  }
});

test("@claim:safe-zone-recommendations shows a move recommendation for every sample alert", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 15_000 });
  await expect(page.locator(".recommendation")).toHaveCount(2);
  await expect(page.locator(".recommendation").first()).toContainText(/Move/);
});

test("@claim:manual-regions adds a protected region from the keyboard", async ({ page }) => {
  await page.goto("/check/");
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  const before = await page.locator("#findings li").count();
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.locator("#findings li").count()).toBeGreaterThanOrEqual(before);
  await expect(page.getByText("Protected region added.")).toBeVisible();
});

test("@claim:json-project-report exports after a valid Studio license response", async ({ page }) => {
  await page.route("**/api/v1/products/caption-placement-check/verify?license=valid-studio-token", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/check/?license=valid-studio-token");
  await page.locator("#video-file").setInputFiles(resolve("tests/fixtures/sample.webm"));
  await page.locator("#caption-file").setInputFiles(resolve("tests/fixtures/sample.srt"));
  await page.getByRole("button", { name: /Scan caption cues/ }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Export JSON · Studio" })).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON · Studio" }).click();
  const report = await download;
  expect(report.suggestedFilename()).toBe("caption-placement-project.json");
  const stream = await report.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk;
  expect(JSON.parse(content)).toMatchObject({ schema: 1 });
});

test("@claim:desktop-downloads offers all desktop platforms and checksum guidance", async ({ page }) => {
  await page.goto("/");
  for (const platform of ["macOS", "Windows", "Linux"]) {
    await expect(page.getByRole("link", { name: platform, exact: true })).toHaveAttribute("href", /releases/);
  }
  await expect(page.locator("#release-status")).toContainText(/Release links resolve|checksums/i);
});

test("native first-run equivalent exposes the shipped sample action", async ({ page }) => {
  await page.goto("/check/");
  await page.getByRole("button", { name: "Load sample project" }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 cues sampled · 2 cues need a closer look", { timeout: 15_000 });
});

test("404 keeps contrast and social metadata on desktop and mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/404.html");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Page not found/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /404/);
  }
});
