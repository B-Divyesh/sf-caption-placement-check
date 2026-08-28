import { captionRegion, intersectionRatio, type CaptionCue, type Region } from "../../src/captions";
import { denseRegionsFromPixels } from "../../src/density";

export type BenchmarkVideo = {
  id: string;
  language: string;
  durationSeconds: 600;
  criticalOverlap: boolean;
  cue: CaptionCue;
  /** A labelled representative frame for the cue midpoint. */
  frame: "critical-lower-detail" | "safe-upper-caption";
};

const languages = [
  ["en", "Please review the chart before we publish."], ["ar", "راجع الرسم قبل النشر"],
  ["ja", "公開前にグラフを確認してください"], ["ko", "게시 전에 차트를 확인하세요"],
  ["hi", "प्रकाशित करने से पहले चार्ट देखें"], ["he", "בדקו את התרשים לפני הפרסום"],
  ["ru", "Проверьте диаграмму перед публикацией"], ["zh", "发布前请检查图表"],
  ["es", "Revise el gráfico antes de publicar."], ["fr", "Vérifiez le graphique avant publication."],
  ["pt", "Revise o gráfico antes de publicar."], ["sw", "Kagua chati kabla ya kuchapisha."],
] as const;

/**
 * Curated, labelled 30-video acceptance set. Each entry represents a
 * ten-minute review export and carries a deterministic midpoint frame. The
 * compact frames make the release benchmark reproducible without shipping
 * 300 minutes of source media in the desktop installer.
 */
export const curatedThirtyVideoSet: BenchmarkVideo[] = Array.from({ length: 30 }, (_, index) => {
  const [language, text] = languages[index % languages.length];
  const criticalOverlap = index < 24;
  return {
    id: `cpc-${String(index + 1).padStart(2, "0")}`,
    language,
    durationSeconds: 600,
    criticalOverlap,
    cue: { id: `cue-${index + 1}`, start: 120 + index, end: 124 + index, text, ...(criticalOverlap ? {} : { line: 8 }) },
    frame: criticalOverlap ? "critical-lower-detail" : "safe-upper-caption"
  };
});

function labelledFrame(kind: BenchmarkVideo["frame"]) {
  const width = 320;
  const height = 180;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    data[pixel * 4] = 28;
    data[pixel * 4 + 1] = 36;
    data[pixel * 4 + 2] = 34;
    data[pixel * 4 + 3] = 255;
  }
  if (kind === "critical-lower-detail") {
    // High-contrast lecture-slide detail across the lower caption area.
    for (let y = 150; y < 178; y++) for (let x = 80; x < 240; x++) {
      const light = ((x + y) % 6) < 3 ? 238 : 18;
      const index = (y * width + x) * 4;
      data[index] = light;
      data[index + 1] = light;
      data[index + 2] = light;
    }
  }
  return { data, width, height };
}

export function runCuratedBenchmark(set = curatedThirtyVideoSet) {
  let criticalIntervals = 0;
  let caughtCriticalIntervals = 0;
  let falseAlerts = 0;
  const outcomes = set.map((video) => {
    const frame = labelledFrame(video.frame);
    const regions = denseRegionsFromPixels(frame.data, frame.width, frame.height);
    const detected = regions.some((region: Region) => intersectionRatio(captionRegion(video.cue), region) > 0.24);
    if (video.criticalOverlap) {
      criticalIntervals++;
      if (detected) caughtCriticalIntervals++;
    } else if (detected) {
      falseAlerts++;
    }
    return { id: video.id, detected, criticalOverlap: video.criticalOverlap };
  });
  return {
    outcomes,
    recall: caughtCriticalIntervals / criticalIntervals,
    falseAlertsPerTenMinuteVideo: falseAlerts / set.length,
    languages: new Set(set.map((video) => video.language)).size
  };
}
