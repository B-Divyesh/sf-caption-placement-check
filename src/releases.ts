export type ReleaseAsset = { name: string; browser_download_url: string };
export type GitHubRelease = { tag_name: string; html_url: string; assets: ReleaseAsset[] };
export type Platform = "windows" | "mac" | "linux";
export type Architecture = "x64" | "arm64";

export const RELEASE_API = "https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest";
export const RELEASE_PAGE = "https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest";
export const RELEASE_CACHE_KEY = "cpc:release-metadata:v1";
export const RELEASE_CACHE_MS = 60 * 60 * 1000;

export function platformFromUserAgent(userAgent: string): Platform {
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "mac";
  return "linux";
}

export function architectureFromUserAgent(userAgent: string): Architecture | undefined {
  if (/aarch64|arm64/i.test(userAgent)) return "arm64";
  if (/Intel Mac OS X|Win64|x86_64|x64|amd64/i.test(userAgent)) return "x64";
  return undefined;
}

type CachedRelease = { savedAt: number; release: GitHubRelease };
type StorageLike = Pick<Storage, "getItem" | "setItem">;
type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, "ok" | "json">>;

export function assetForPlatform(release: GitHubRelease, platform: Platform, architecture?: Architecture): ReleaseAsset | undefined {
  const architecturePattern = architecture === "arm64" ? /(aarch64|arm64)/i : architecture === "x64" ? /(x86_64|x64|amd64)/i : undefined;
  const matchesArchitecture = (asset: ReleaseAsset) => !architecturePattern || architecturePattern.test(asset.name);
  if (platform === "mac") return release.assets.find((asset) => /\.dmg$/i.test(asset.name) && matchesArchitecture(asset));
  if (platform === "windows") return release.assets.find((asset) => /\.msi$/i.test(asset.name) && matchesArchitecture(asset))
    || release.assets.find((asset) => /\.exe$/i.test(asset.name) && matchesArchitecture(asset));
  // AppImage is the portable fallback. Do not guess a Debian/RPM package from a browser user agent.
  return release.assets.find((asset) => /\.AppImage$/i.test(asset.name) && matchesArchitecture(asset));
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
