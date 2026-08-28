import { describe, expect, it } from "vitest";
import { captionRegion, findingToCsv, intersectionRatio, parseCaptions, recommendZone, timestampToSeconds } from "../src/captions";

describe("caption parsing", () => {
  it("parses SRT timing and multiline text", () => {
    const cues = parseCaptions("1\r\n00:00:01,250 --> 00:00:03,500\r\nHello <i>world</i>\r\nSecond line\r\n\r\n2\r\n00:00:05,000 --> 00:00:06,000\r\n再见");
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ id: "1", start: 1.25, end: 3.5, text: "Hello world\nSecond line" });
    expect(cues[1].text).toBe("再见");
  });

  it("parses WebVTT settings", () => {
    const [cue] = parseCaptions("WEBVTT\n\nintro\n00:01.000 --> 00:04.000 line:8% position:40% size:60%\nBonjour");
    expect(cue).toMatchObject({ id: "intro", start: 1, end: 4, line: 8, position: 40, size: 60 });
    expect(captionRegion(cue).y).toBe(0.08);
  });

  it("rejects empty, malformed, and backwards cues", () => {
    expect(() => parseCaptions(" ")).toThrow("empty");
    expect(() => parseCaptions("not captions")).toThrow("No timed captions");
    expect(() => parseCaptions("1\n00:00:03,000 --> 00:00:02,000\nWrong")).toThrow("ends before");
  });

  it("supports short and hour timestamps", () => {
    expect(timestampToSeconds("01:02.500")).toBe(62.5);
    expect(timestampToSeconds("01:02:03,250")).toBe(3723.25);
  });
});

describe("placement analysis helpers", () => {
  it("calculates overlap relative to the smaller region", () => {
    expect(intersectionRatio({ x: 0, y: 0, width: .5, height: .5 }, { x: .25, y: .25, width: .5, height: .5 })).toBeCloseTo(.25);
    expect(intersectionRatio({ x: 0, y: 0, width: .1, height: .1 }, { x: .5, y: .5, width: .1, height: .1 })).toBe(0);
  });

  it("recommends a zone away from a bottom obstruction", () => {
    expect(recommendZone([{ x: 0, y: .7, width: 1, height: .3 }], captionRegion({ id: "1", start: 0, end: 1, text: "x" }))).toContain("top");
  });

  it("escapes CSV and retains non-Latin captions", () => {
    const cue = { id: "1", start: 1, end: 2, text: "مرحبا, \"العالم\"" };
    const csv = findingToCsv([{ id: "f", cue, kind: "dense", confidence: .68, region: { x: 0, y: 0, width: 1, height: 1 }, captionRegion: captionRegion(cue), recommendation: "Move", reviewed: false }]);
    expect(csv).toContain("مرحبا, \"\"العالم\"\"");
    expect(csv).toContain("confidence_percent");
  });
});
