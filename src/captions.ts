export type CaptionCue = {
  id: string;
  start: number;
  end: number;
  text: string;
  line?: number;
  position?: number;
  size?: number;
};

export type Region = { x: number; y: number; width: number; height: number };
export type FindingKind = "face" | "dense" | "protected";
export type Finding = {
  id: string;
  cue: CaptionCue;
  kind: FindingKind;
  confidence: number;
  region: Region;
  captionRegion: Region;
  recommendation: string;
  reviewed: boolean;
};

const TIMING = /((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3})(.*)/;

export function timestampToSeconds(value: string): number {
  const parts = value.trim().replace(",", ".").split(":").map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) throw new Error(`Invalid timestamp: ${value}`);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function parseCaptions(input: string): CaptionCue[] {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
  if (!normalized) throw new Error("The caption file is empty.");
  const blocks = normalized.replace(/^WEBVTT[^\n]*\n+/, "").split(/\n{2,}/);
  const cues: CaptionCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => !line.startsWith("NOTE"));
    const timingIndex = lines.findIndex((line) => TIMING.test(line));
    if (timingIndex < 0) continue;
    const match = lines[timingIndex].match(TIMING);
    if (!match) continue;
    const start = timestampToSeconds(match[1]);
    const end = timestampToSeconds(match[2]);
    if (end <= start) throw new Error(`A caption ends before it starts at ${formatTime(start)}.`);
    const settings = match[3];
    const line = settings.match(/line:(\d+(?:\.\d+)?)%?/)?.[1];
    const position = settings.match(/position:(\d+(?:\.\d+)?)%/)?.[1];
    const size = settings.match(/size:(\d+(?:\.\d+)?)%/)?.[1];
    const text = lines.slice(timingIndex + 1).join("\n").replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    cues.push({
      id: lines[timingIndex - 1]?.trim() || `cue-${cues.length + 1}`,
      start,
      end,
      text,
      line: line ? Number(line) : undefined,
      position: position ? Number(position) : undefined,
      size: size ? Number(size) : undefined
    });
  }

  if (!cues.length) throw new Error("No timed cues were found. Choose a valid .srt or .vtt file.");
  return cues.sort((a, b) => a.start - b.start);
}

export function captionRegion(cue: CaptionCue): Region {
  const width = Math.min(0.9, Math.max(0.3, (cue.size ?? 76) / 100));
  const center = (cue.position ?? 50) / 100;
  const y = cue.line == null ? 0.78 : Math.min(0.82, Math.max(0.02, cue.line / 100));
  return { x: Math.max(0.02, Math.min(0.98 - width, center - width / 2)), y, width, height: 0.16 };
}

export function intersectionRatio(a: Region, b: Region): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return (width * height) / Math.max(0.0001, Math.min(a.width * a.height, b.width * b.height));
}

const ZONES: Array<{ name: string; region: Region }> = [
  { name: "top center", region: { x: 0.12, y: 0.05, width: 0.76, height: 0.16 } },
  { name: "bottom center", region: { x: 0.12, y: 0.79, width: 0.76, height: 0.16 } },
  { name: "upper left", region: { x: 0.04, y: 0.08, width: 0.56, height: 0.16 } },
  { name: "upper right", region: { x: 0.4, y: 0.08, width: 0.56, height: 0.16 } }
];

export function recommendZone(regions: Region[], current: Region): string {
  const ranked = ZONES.map((zone) => ({
    ...zone,
    score: regions.reduce((sum, region) => sum + intersectionRatio(zone.region, region), 0)
  })).sort((a, b) => a.score - b.score);
  if (intersectionRatio(ranked[0].region, current) > 0.8) return "Shorten or split this cue to reduce the caption block.";
  return `Move this cue to ${ranked[0].name} for this interval.`;
}

export function findingToCsv(findings: Finding[]): string {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = findings.map((item) => [
    formatTime(item.cue.start), formatTime(item.cue.end), item.kind, Math.round(item.confidence * 100),
    item.cue.text.replace(/\n/g, " "), item.recommendation, item.reviewed ? "reviewed" : "open"
  ].map(quote).join(","));
  return ["start,end,reason,confidence_percent,caption,recommendation,status", ...rows].join("\n");
}
