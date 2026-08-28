import type { Region } from "./captions";

/**
 * Return the coarse high-detail areas in a sampled video frame. Keeping this
 * independent of Canvas makes the detector reproducible against the labelled
 * benchmark as well as in the browser review flow.
 */
export function denseRegionsFromPixels(data: Uint8ClampedArray, width: number, height: number): Region[] {
  const cols = 8;
  const rows = 6;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const regions: Region[] = [];
  const luminance = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let edges = 0;
      let samples = 0;
      let horizontalRuns = 0;
      for (let y = row * cellH + 2; y < Math.min(height - 2, (row + 1) * cellH); y += 2) {
        let rowEdges = 0;
        for (let x = col * cellW + 2; x < Math.min(width - 2, (col + 1) * cellW); x += 2) {
          const gx = Math.abs(luminance(x + 1, y) - luminance(x - 1, y));
          const gy = Math.abs(luminance(x, y + 1) - luminance(x, y - 1));
          if (gx + gy > 82) {
            edges++;
            rowEdges++;
          }
          samples++;
        }
        if (rowEdges >= 3) horizontalRuns++;
      }
      if (edges / Math.max(1, samples) > 0.18 && horizontalRuns >= 3) {
        regions.push({ x: col / cols, y: row / rows, width: 1 / cols, height: 1 / rows });
      }
    }
  }
  return regions;
}
