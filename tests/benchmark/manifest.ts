export type BenchmarkCase = {
  id: string;
  media: string;
  language: string;
  label: "critical" | "control";
  signal: "portrait" | "dense" | "safe-portrait";
  durationSeconds: 600;
};

const languages = ["en", "ar", "ja", "ko", "hi", "he", "ru", "zh", "es", "fr", "pt", "sw"] as const;

/** Thirty independently encoded, labelled ten-minute WebM fixtures. */
export const curatedThirtyVideoSet: BenchmarkCase[] = Array.from({ length: 30 }, (_, zeroIndex) => {
  const index = zeroIndex + 1;
  const label = index <= 24 ? "critical" : "control";
  return {
    id: `cpc-${String(index).padStart(2, "0")}`,
    media: `cpc-${String(index).padStart(2, "0")}.webm`,
    language: languages[zeroIndex % languages.length],
    label,
    signal: label === "control" ? "safe-portrait" : index <= 12 ? "portrait" : "dense",
    durationSeconds: 600
  };
});
