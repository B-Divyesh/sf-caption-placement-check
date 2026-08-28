import "./styles.css";
import "./site.css";
import { assetForPlatform, loadReleaseMetadata, RELEASE_PAGE, type Architecture, type Platform } from "./releases";

const download = document.querySelector<HTMLAnchorElement>("#platform-download");
const label = document.querySelector("#platform-label");
const status = document.querySelector("#release-status");
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-platform]")];
const isWindows = /Windows/i.test(navigator.userAgent);
const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
const platform: Platform = isWindows ? "windows" : isMac ? "mac" : "linux";
const names = { windows: "Windows", mac: "macOS", linux: "Linux" };
if (label) label.textContent = `${names[platform]} detected`;
if (download) download.textContent = `Choose a ${names[platform]} build`;

async function detectedArchitecture(): Promise<Architecture | undefined> {
  const navigatorWithHints = navigator as Navigator & { userAgentData?: { getHighEntropyValues(values: string[]): Promise<{ architecture?: string; bitness?: string }> } };
  try {
    const hints = await navigatorWithHints.userAgentData?.getHighEntropyValues(["architecture", "bitness"]);
    if (hints?.architecture && /arm|aarch/i.test(hints.architecture)) return "arm64";
    if (hints?.architecture && /x86|amd/i.test(hints.architecture)) return "x64";
  } catch { /* Browsers can deny high-entropy hints. A release page is safer than a wrong binary. */ }
  if (/Intel Mac OS X|Win64|x86_64|x64|amd64/i.test(navigator.userAgent)) return "x64";
  if (/aarch64|arm64/i.test(navigator.userAgent)) return "arm64";
  return undefined;
}

function publishingState() {
  if (download) download.href = RELEASE_PAGE;
  links.forEach((link) => { link.href = RELEASE_PAGE; });
  if (status) status.textContent = "Downloads are being published. Visit the release page for the newest build.";
}

const isProduction = location.hostname === "caption-placement-check.sociobot.in";
if (download && status && isProduction) void Promise.all([loadReleaseMetadata(fetch, localStorage), detectedArchitecture()]).then(([release, architecture]) => {
  if (!release) return publishingState();
  const asset = architecture ? assetForPlatform(release, platform, architecture) : undefined;
  if (!asset) {
    download.href = release.html_url;
    download.textContent = `Choose a ${names[platform]} build`;
    if (label) label.textContent = architecture ? `${names[platform]} build unavailable` : `${names[platform]} architecture not detected`;
    links.forEach((link) => { link.href = release.html_url; });
    status.textContent = "Choose the build that matches your computer. Downloads include SHA-256 checksums.";
    return;
  }
  download.href = asset.browser_download_url;
  download.textContent = `Download for ${names[platform]} ${architecture === "arm64" ? "ARM64" : "x64"}`;
  for (const link of links) {
    const target = assetForPlatform(release, link.dataset.platform as Platform, architecture);
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

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
