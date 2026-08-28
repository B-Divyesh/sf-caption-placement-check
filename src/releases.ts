export type ReleaseAsset = { name: string; browser_download_url: string };
export type GitHubRelease = { tag_name: string; html_url: string; assets: ReleaseAsset[] };
export type Platform = "windows" | "mac" | "linux";

export const RELEASE_API = "https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest";
export const RELEASE_PAGE = "https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest";
export const RELEASE_CACHE_KEY = "cpc:release-metadata:v1";
export const RELEASE_CACHE_MS = 60 * 60 * 1000;

type CachedRelease = { savedAt: number; release: GitHubRelease };
type StorageLike = Pick<Storage, "getItem" | "setItem">;
type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, "ok" | "json">>;

export function assetForPlatform(release: GitHubRelease, platform: Platform): ReleaseAsset | undefined {
  const extensions: Record<Platform, RegExp> = {
    mac: /\.dmg$/i,
    windows: /\.(msi|exe)$/i,
    linux: /\.(AppImage|deb|rpm)$/i
  };
  return release.assets.find((asset) => extensions[platform].test(asset.name));
}

function validRelease(value: unknown): value is GitHubRelease {
  if (!value || typeof value !== "object") return false;
  const release = value as Partial<GitHubRelease>;
  return typeof release.tag_name === "string" && typeof release.html_url === "string" && Array.isArray(release.assets)
    && release.assets.every((asset) => typeof asset?.name === "string" && typeof asset?.browser_download_url === "string");
}

export function readCachedRelease(storage: StorageLike, now = Date.now()): GitHubRelease | undefined {
  try {
    const cached = JSON.parse(storage.getItem(RELEASE_CACHE_KEY) || "null") as CachedRelease | null;
    if (cached && now - cached.savedAt < RELEASE_CACHE_MS && validRelease(cached.release)) return cached.release;
  } catch {
    // Storage may be unavailable or contain an old value. A network lookup can still succeed.
  }
  return undefined;
}

export async function loadReleaseMetadata(fetcher: FetchLike, storage: StorageLike, now = Date.now()): Promise<GitHubRelease | undefined> {
  const cached = readCachedRelease(storage, now);
  if (cached) return cached;
  try {
    const response = await fetcher(RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) return undefined;
    const release = await response.json();
    if (!validRelease(release)) return undefined;
    try { storage.setItem(RELEASE_CACHE_KEY, JSON.stringify({ savedAt: now, release } satisfies CachedRelease)); } catch { /* cache is optional */ }
    return release;
  } catch {
    return undefined;
  }
}
