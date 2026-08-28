import { describe, expect, it, vi } from "vitest";
import { assetForPlatform, loadReleaseMetadata, RELEASE_API, RELEASE_CACHE_KEY } from "../src/releases";

const release = {
  tag_name: "v0.1.0",
  html_url: "https://github.com/B-Divyesh/sf-caption-placement-check/releases/tag/v0.1.0",
  assets: [
    { name: "CaptionPlacementCheck.dmg", browser_download_url: "https://github.com/example/mac.dmg" },
    { name: "CaptionPlacementCheck.msi", browser_download_url: "https://github.com/example/windows.msi" },
    { name: "caption-placement-check.AppImage", browser_download_url: "https://github.com/example/linux.AppImage" }
  ]
};

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("GitHub release metadata", () => {
  it("@regression:github-api reads the CORS-enabled API and caches a successful response", async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => release });
    await expect(loadReleaseMetadata(fetcher, storage, 1_000)).resolves.toEqual(release);
    expect(fetcher).toHaveBeenCalledWith(RELEASE_API, expect.any(Object));
    expect(JSON.parse(storage.getItem(RELEASE_CACHE_KEY)!)).toMatchObject({ savedAt: 1_000, release });
  });

  it("@regression:github-api uses fresh cached metadata without another browser request", async () => {
    const storage = memoryStorage({ [RELEASE_CACHE_KEY]: JSON.stringify({ savedAt: 1_000, release }) });
    const fetcher = vi.fn();
    await expect(loadReleaseMetadata(fetcher, storage, 1_001)).resolves.toEqual(release);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("@regression:github-api turns a missing release or network failure into an empty state", async () => {
    const storage = memoryStorage();
    await expect(loadReleaseMetadata(vi.fn().mockRejectedValue(new Error("CORS blocked")), storage)).resolves.toBeUndefined();
    await expect(loadReleaseMetadata(vi.fn().mockResolvedValue({ ok: false }), storage)).resolves.toBeUndefined();
  });

  it("selects the installable asset for each platform", () => {
    expect(assetForPlatform(release, "mac")?.name).toMatch(/dmg$/);
    expect(assetForPlatform(release, "windows")?.name).toMatch(/msi$/);
    expect(assetForPlatform(release, "linux")?.name).toMatch(/AppImage$/);
  });
});
