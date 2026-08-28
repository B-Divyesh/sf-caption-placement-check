import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { curatedThirtyVideoSet } from "../benchmark/manifest";

test("@regression:brief-success-measure decodes the labelled 30-video corpus and meets recall and false-alert limits", async ({ page }) => {
  let critical = 0;
  let caught = 0;
  let falseAlerts = 0;
  for (const specimen of curatedThirtyVideoSet) {
    await page.goto("/check/");
    await page.locator("#video-file").setInputFiles(resolve("tests/benchmark/media", specimen.media));
    await page.locator("#caption-file").setInputFiles(resolve("tests/benchmark", specimen.label === "critical" ? "critical.srt" : "control.srt"));
    await page.getByRole("button", { name: /Scan caption cues/ }).click();
    await expect(page.locator("#scan-summary")).toContainText("1 cues sampled", { timeout: 20_000 });
    const findingCount = await page.locator("#findings li").count();
    if (specimen.label === "critical") { critical++; if (findingCount > 0) caught++; }
    else falseAlerts += findingCount;
  }
  expect(caught / critical).toBeGreaterThanOrEqual(.85);
  expect(falseAlerts / curatedThirtyVideoSet.filter((item) => item.label === "control").length).toBeLessThan(3);
});
