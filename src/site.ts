import "./styles.css";
import "./site.css";

type Asset = { url: string; sha256?: string; name?: string };
type Manifest = { version: string; platforms: Record<string, Asset | Asset[]> };
const manifestUrl = "https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest/download/latest.json";
const download = document.querySelector<HTMLAnchorElement>("#platform-download");
const label = document.querySelector("#platform-label");
const status = document.querySelector("#release-status");
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-platform]")];
const isWindows = /Windows/i.test(navigator.userAgent);
const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
const platform = isWindows ? "windows" : isMac ? "mac" : "linux";
const names = { windows: "Windows", mac: "macOS", linux: "Linux" };
if (label) label.textContent = `${names[platform]} detected`;
if (download) download.textContent = `Download for ${names[platform]}`;

function firstAsset(value?: Asset | Asset[]) { return Array.isArray(value) ? value[0] : value; }

if (download && status) fetch(manifestUrl, { cache: "no-cache" }).then(async (response) => {
  if (!response.ok) throw new Error("No release manifest");
  const manifest = await response.json() as Manifest;
  const asset = firstAsset(manifest.platforms[platform]);
  if (asset?.url) download.href = asset.url;
  for (const link of links) {
    const target = firstAsset(manifest.platforms[link.dataset.platform!]);
    if (target?.url) link.href = target.url;
  }
  status.textContent = `Latest: v${manifest.version.replace(/^v/, "")} · SHA-256 checksums published with the release.`;
}).catch(() => {
  status.textContent = "The first signed-off build is being prepared. The browser checker is available now.";
});

if (isWindows) document.querySelector("#install-command")!.textContent = "irm https://caption-placement-check.sociobot.in/install.ps1 | iex";
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
  const source = document.querySelector(button.dataset.copy!)!;
  await navigator.clipboard.writeText(source.textContent || "");
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = "Copy command"; }, 1600);
}));

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
