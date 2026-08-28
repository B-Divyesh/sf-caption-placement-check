import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { curatedThirtyVideoSet } from "./benchmark/manifest";

describe("labelled 30-video placement benchmark", () => {
  it("@claim:benchmark-corpus includes 30 labelled encoded video fixtures", () => {
    expect(curatedThirtyVideoSet).toHaveLength(30);
    expect(new Set(curatedThirtyVideoSet.map((video) => video.id)).size).toBe(30);
    expect(new Set(curatedThirtyVideoSet.map((video) => video.language)).size).toBeGreaterThanOrEqual(8);
    expect(curatedThirtyVideoSet.filter((video) => video.label === "critical")).toHaveLength(24);
    expect(curatedThirtyVideoSet.every((video) => video.durationSeconds === 600)).toBe(true);
    for (const video of curatedThirtyVideoSet) {
      const fixture = resolve("tests/benchmark/media", video.media);
      expect(existsSync(fixture), `${video.id} media fixture`).toBe(true);
      expect(statSync(fixture).size, `${video.id} must be encoded media`).toBeGreaterThan(1_000);
    }
  });
});
