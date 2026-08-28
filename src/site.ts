import "./styles.css";
import "./site.css";
import { assetForPlatform, loadReleaseMetadata, RELEASE_PAGE, type Platform } from "./releases";

const download = document.querySelector<HTMLAnchorElement>("#platform-download");
const label = document.querySelector("#platform-label");
const status = document.querySelector("#release-status");
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-platform]")];
const isWindows = /Windows/i.test(navigator.userAgent);
const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
const platform: Platform = isWindows ? "windows" : isMac ? "mac" : "linux";
const names = { windows: "Windows", mac: "macOS", linux: "Linux" };
if (label) label.textContent = `${names[platform]} detected`;
if (download) download.textContent = `Download for ${names[platform]}`;

function publishingState() {
  if (download) download.href = RELEASE_PAGE;
  links.forEach((link) => { link.href = RELEASE_PAGE; });
  if (status) status.textContent = "Downloads are being published. Visit the release page for the newest build.";
}

const isProduction = location.hostname === "caption-placement-check.sociobot.in";
if (download && status && isProduction) void loadReleaseMetadata(fetch, localStorage).then((release) => {
  if (!release) return publishingState();
  const asset = assetForPlatform(release, platform);
  if (!asset) return publishingState();
  download.href = asset.browser_download_url;
  for (const link of links) {
    const target = assetForPlatform(release, link.dataset.platform as Platform);
    link.href = target?.browser_download_url || release.html_url;
  }
  status.textContent = `Latest: ${release.tag_name} · SHA-256 checksums are published with this release.`;
}).catch(publishingState);
else if (status) status.textContent = "Release links resolve on the production site. The browser checker is available now.";

if (isWindows) document.querySelector("#install-command")!.textContent = "irm https://caption-placement-check.sociobot.in/install.ps1 | iex";
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
  const source = document.querySelector(button.dataset.copy!)!;
  try {
    await navigator.clipboard.writeText(source.textContent || "");
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = "Copy command"; }, 1600);
  } catch { button.textContent = "Select the command to copy"; }
}));

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js?revision=3").catch(() => undefined));
