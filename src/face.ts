import type { Region } from "./captions";

/**
 * A deliberately conservative local fallback for browsers without the Shape
 * Detection API. It finds sizeable connected areas with skin-like colour and
 * an approximately portrait-shaped footprint. It is an advisory signal, not
 * identity recognition, and never sends a frame off the device.
 */
export function fallbackFaceRegions(data: Uint8ClampedArray, width: number, height: number): Region[] {
  const step = 3;
  const columns = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const seen = new Uint8Array(columns * rows);
  const skin = (x: number, y: number) => {
    const index = (Math.min(height - 1, y * step) * width + Math.min(width - 1, x * step)) * 4;
    const r = data[index], g = data[index + 1], b = data[index + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return r > 58 && g > 28 && b > 14 && max - min > 18 && r >= g * 1.08 && g >= b * .72;
  };
  const regions: Region[] = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start]) continue;
    const sx = start % columns, sy = Math.floor(start / columns);
    if (!skin(sx, sy)) { seen[start] = 1; continue; }
    const queue = [start]; seen[start] = 1;
    let count = 0, minX = sx, maxX = sx, minY = sy, maxY = sy;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const point = queue[cursor], x = point % columns, y = Math.floor(point / columns);
      count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
        const next = ny * columns + nx;
        if (!seen[next] && skin(nx, ny)) { seen[next] = 1; queue.push(next); }
      }
    }
    const regionWidth = (maxX - minX + 1) / columns, regionHeight = (maxY - minY + 1) / rows;
    const aspect = regionWidth / regionHeight;
    if (count >= 20 && regionWidth >= .07 && regionHeight >= .09 && aspect >= .45 && aspect <= 1.5) {
      regions.push({ x: minX / columns, y: minY / rows, width: regionWidth, height: regionHeight });
    }
  }
  return regions;
}
