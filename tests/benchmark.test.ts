import { describe, expect, it } from "vitest";
import { curatedThirtyVideoSet, runCuratedBenchmark } from "./benchmark/curated-30-videos";

describe("labelled 30-video placement benchmark", () => {
  it("@regression:brief-success-measure meets the documented recall and false-alert thresholds", () => {
    const result = runCuratedBenchmark();
    expect(curatedThirtyVideoSet).toHaveLength(30);
    expect(new Set(curatedThirtyVideoSet.map((video) => video.id)).size).toBe(30);
    expect(result.languages).toBeGreaterThanOrEqual(8);
    expect(result.recall).toBeGreaterThanOrEqual(0.85);
    expect(result.falseAlertsPerTenMinuteVideo).toBeLessThan(3);
  });
});
