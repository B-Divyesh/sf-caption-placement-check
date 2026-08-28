import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";

const origin = "http://127.0.0.1:4173";
const releaseApi = "https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest";
const releasePage = "https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest";

async function scan(page: import("@playwright/test").Page, captions = "tests/fixtures/sample.srt", media = "tests/fixtures/sample.webm") {
  await page.locator("#video-file").setInputFiles(resolve(media));
  await page.locator("#caption-file").setInputFiles(resolve(captions));
  await page.getByRole("button", { name: "Check caption placement" }).click();
  await expect(page.locator("#scan-summary")).toContainText(/captions? checked/, { timeout: 20_000 });
}

async function downloadText(page: import("@playwright/test").Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button }).click();
  const result = await pending;
  const stream = await result.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk.toString();
  return { result, content };
}

test("landing is accessible and routes to the checker", async ({ page }) => {
  await page.route(releaseApi, (route) => route.abort());
  await page.goto("/");
  await expect(page).toHaveTitle("Caption Placement Check — check caption placement");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
  await page.getByRole("link", { name: "Check your own files" }).click();
  await expect(page.getByRole("heading", { name: "Check captions against the video frame." })).toBeFocused();
});

test("@claim:sample-demo opens a useful two-alert sample without saving demo data", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page).toHaveURL(/\/demo\/\?demo=1$/);
  await expect(page).toHaveTitle("Demo — Caption Placement Check");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#scan-summary")).toContainText("2 captions checked · 2 alerts need review", { timeout: 20_000 });
  await expect(page.locator("#findings li")).toHaveCount(2);
  await expect(page.locator(".recommendation")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("demo:") || key.startsWith("cpc:") || key.startsWith("sb_license:")).length)).toBe(0);
});

test("@claim:demo-isolation never reads, sends, or changes real-data keys", async ({ page }) => {
  const protectedKeys = ["sb_license:caption-placement-check", "sb_license:caption-placement-check:verdict", "cpc:protected-regions", "cpc:release-metadata:v1"];
  await page.addInitScript((keys) => {
    (window as unknown as { __protectedReads: string[] }).__protectedReads = [];
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (keys.includes(key)) (window as unknown as { __protectedReads: string[] }).__protectedReads.push(key);
      return original.call(this, key);
    };
  }, protectedKeys);
  await page.goto("/check/");
  await page.evaluate((keys) => keys.forEach((key) => localStorage.setItem(key, `sentinel:${key}`)), protectedKeys);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Save protected regions" }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  expect(await page.evaluate(() => (window as unknown as { __protectedReads: string[] }).__protectedReads)).toEqual([]);
  expect(await page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])), protectedKeys))
    .toEqual(Object.fromEntries(protectedKeys.map((key) => [key, `sentinel:${key}`])));
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true);
});

test("@claim:media-local processes selected media without uploads", async ({ page }) => {
  const requests: Array<{ url: string; method: string; postData: string | null }> = [];
  page.on("request", (request) => requests.push({ url: request.url(), method: request.method(), postData: request.postData() }));
  await page.goto("/?demo=1");
  await page.getByRole("link", { name: "Start for real" }).click();
  await scan(page);
  expect(requests.every((request) => new URL(request.url).origin === origin)).toBe(true);
  expect(requests.filter((request) => request.method !== "GET" || request.postData).map((request) => request.url)).toEqual([]);
});

test("@claim:no-account completes both free exports without account or purchase controls", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator("input[type=password], input[autocomplete=username]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|purchase/i })).toHaveCount(0);
  expect((await downloadText(page, "Export alerts as CSV")).content).toContain("recommendation");
  expect(JSON.parse((await downloadText(page, "Export project as JSON")).content)).toMatchObject({ schema: 1 });
});

test("@claim:saved-regions-local writes only after Save", async ({ page }) => {
  await page.goto("/check/");
  await scan(page);
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => localStorage.getItem("cpc:protected-regions"))).toBeNull();
  await page.getByRole("button", { name: "Save protected regions" }).click();
  await expect(page.getByText(/protected region.+saved for future checks/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cpc:protected-regions"))).not.toBeNull();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["cpc:protected-regions"]);
});

test("@claim:no-tracking allows release data but no analytics or third-party fonts", async ({ page }) => {
  await page.route(releaseApi, async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ tag_name: "v0.1.4", html_url: releasePage, assets: [] }) }));
  const requests: Array<{ url: string; type: string }> = [];
  page.on("request", (request) => requests.push({ url: request.url(), type: request.resourceType() }));
  for (const route of ["/", "/demo/?demo=1", "/check/", "/privacy/", "/terms/", "/404.html"]) await page.goto(route);
  const origins = new Set(requests.map((request) => new URL(request.url).origin));
  expect([...origins].every((requestOrigin) => [origin, "https://api.github.com"].includes(requestOrigin))).toBe(true);
  expect(requests.filter((request) => request.type === "font" && new URL(request.url).origin !== origin)).toEqual([]);
  expect(requests.map((request) => request.url).join("\n")).not.toMatch(/google-analytics|googletagmanager|segment|mixpanel|plausible|posthog/i);
});

test("@claim:offline-demo reloads the shipped demo after its first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()));
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  });
  await page.goto("/?demo=1");
  await expect(page.locator("#scan-summary")).toContainText("2 captions checked", { timeout: 20_000 });
  await expect.poll(() => page.locator("html").getAttribute("data-offline-ready")).toBe("true");
  expect(await page.evaluate(async () => {
    const cache = await caches.open("caption-placement-check-v10");
    const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[rel=stylesheet][href]")]
      .map((element) => "src" in element && element.src ? element.src : (element as HTMLLinkElement).href);
    return Promise.all(assets.map(async (asset) => {
      const cached = await cache.match(asset);
      return Boolean(cached) && !cached!.headers.has("content-encoding");
    }));
  })).toEqual([true, true]);
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle("Demo — Caption Placement Check", { timeout: 20_000 });
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#findings li")).toHaveCount(2);
  await context.setOffline(false);
});

test("@claim:release-fallback links to Releases for failed and empty metadata without console errors", async ({ page }) => {
  await page.addInitScript((api) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (String(input) === api) {
        return new URL(location.href).searchParams.get("case") === "failed"
          ? Promise.reject(new Error("controlled release network failure"))
          : Promise.resolve(new Response("{}", { status: 404, headers: { "Content-Type": "application/json" } }));
      }
      return nativeFetch(input, init);
    };
  }, releaseApi);
  for (const response of ["failed", "empty"] as const) {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`/?case=${response}`);
    await expect(page.locator("#release-status")).toContainText("Downloads are being published");
    await expect(page.locator("#platform-download")).toHaveAttribute("href", releasePage);
    expect(errors).toEqual([]);
  }
});

test("route navigation and Back focus and announce each h1", async ({ page }) => {
  await page.route(releaseApi, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("h1")).toBeFocused();
  await page.getByRole("link", { name: "Demo", exact: true }).first().click();
  await expect(page).toHaveURL(/\/demo\//);
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#route-announcer")).toContainText("Demo — Caption Placement Check");
  await page.goBack();
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("#route-announcer")).toContainText("Check captions before they hide the video");
});

test("checker keyboard flow and populated demo pass axe", async ({ page }) => {
  await page.goto("/check/");
  for (let index = 0; index < 6; index++) await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("link", { name: "Skip to checker" })).toBeFocused();
  await scan(page);
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await expect(page.locator("#overlay")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ["serious", "critical", "moderate"].includes(issue.impact || ""))).toEqual([]);
  }
});

test("every route has complete metadata, consistent navigation, and mobile layout", async ({ page }) => {
  await page.route(releaseApi, (route) => route.abort());
  const routes = ["/", "/demo/?demo=1", "/check/", "/privacy/", "/terms/", "/404.html"];
  for (const route of routes) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("header nav a")).toHaveCount(4);
    await expect(page.locator("footer nav a")).toHaveCount(4);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"][sizes="180x180"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ["serious", "critical"].includes(issue.impact || ""))).toEqual([]);
  }
});

test("first-screen action remains visible at 390px", async ({ page }) => {
  await page.route(releaseApi, (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const action = page.getByRole("link", { name: "Try it with sample data" });
  await expect(action).toBeVisible();
  expect((await action.boundingBox())!.y + (await action.boundingBox())!.height).toBeLessThan(844);
});

test("@claim:local-scan exports two complete CSV alert rows", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  const { result, content } = await downloadText(page, "Export alerts as CSV");
  expect(result.suggestedFilename()).toBe("caption-placement-alerts.csv");
  expect(content.trim().split("\n")).toHaveLength(3);
  expect(content).toContain("start,end,reason,confidence_percent,caption,recommendation,status");
});

test("@claim:json-project-report exports a free report with both alerts", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  const { result, content } = await downloadText(page, "Export project as JSON");
  expect(result.suggestedFilename()).toBe("caption-placement-project.json");
  expect(JSON.parse(content)).toMatchObject({ schema: 1, findings: [{}, {}] });
});

test("@claim:caption-formats scans SRT and positioned WebVTT", async ({ page }) => {
  for (const captions of ["tests/fixtures/sample.srt", "tests/fixtures/sample.vtt"]) {
    await page.goto("/check/");
    await scan(page, captions);
    await expect(page.locator("#scan-summary")).toContainText("2 captions checked");
  }
});

test("@claim:unicode-captions keeps Arabic and Japanese text in alerts and CSV", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator("q", { hasText: "مرحبا بكم في الدرس." })).toBeVisible();
  await expect(page.locator("q", { hasText: "この図には二つの要点があります。" })).toBeVisible();
  const { content } = await downloadText(page, "Export alerts as CSV");
  expect(content).toContain("مرحبا بكم في الدرس.");
  expect(content).toContain("この図には二つの要点があります。");
});

test("@claim:local-detection repeatedly flags portrait and dense overlap fixtures", async ({ page }) => {
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const media of ["cpc-01.webm", "cpc-13.webm"]) {
      await page.goto("/check/");
      await scan(page, "tests/benchmark/critical.srt", `tests/benchmark/media/${media}`);
      await expect(page.locator("#findings li")).toHaveCount(1, { timeout: 20_000 });
    }
  }
});

test("@claim:safe-zone-recommendations gives every sample alert a move", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#findings li")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator(".recommendation")).toHaveCount(2);
  for (const recommendation of await page.locator(".recommendation").all()) await expect(recommendation).toContainText(/Move/);
});

test("@claim:manual-regions supports keyboard and pointer marking", async ({ page }) => {
  await page.goto("/check/");
  await scan(page);
  await page.getByRole("button", { name: "Mark protected region" }).click();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Protected region added.")).toBeVisible();
  const box = await page.locator("#overlay").boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + 30, box!.y + 30);
  await page.mouse.down();
  await page.mouse.move(box!.x + 120, box!.y + 100);
  await page.mouse.up();
  const report = JSON.parse((await downloadText(page, "Export project as JSON")).content);
  expect(report.protectedRegions.length).toBeGreaterThanOrEqual(2);
});

test("native first-run sample opens two alerts", async ({ page }) => {
  await page.goto("/check/");
  await page.getByRole("button", { name: "Load sample project" }).click();
  await expect(page.locator("#scan-summary")).toContainText("2 captions checked · 2 alerts need review", { timeout: 20_000 });
});

test("external release links identify their destination", async ({ page }) => {
  await page.route(releaseApi, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#platform-download")).toHaveAccessibleName(/external/i);
  for (const link of await page.locator("[data-platform]").all()) await expect(link).toHaveAccessibleName(/external/i);
});
