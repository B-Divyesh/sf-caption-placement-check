import "./styles.css";
import {
  captionRegion, findingToCsv, formatTime, intersectionRatio, parseCaptions, recommendZone,
  type CaptionCue, type Finding, type FindingKind, type Region
} from "./captions";
import { denseRegionsFromPixels } from "./density";
import { fallbackFaceRegions } from "./face";

type FaceDetectorLike = { detect(input: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>> };

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const videoInput = $("#video-file") as HTMLInputElement;
const captionInput = $("#caption-file") as HTMLInputElement;
const startButton = $("#start-scan") as HTMLButtonElement;
const video = $("#video") as HTMLVideoElement;
const overlay = $("#overlay") as HTMLCanvasElement;
const stage = $("#video-stage");
const review = $("#review");
const inputError = $("#input-error");
const placement = $("#placement") as HTMLSelectElement;
const isDemo = location.pathname.replace(/\/+$/, "") === "/demo" || document.documentElement.dataset.demoShell === "true" || new URLSearchParams(location.search).get("demo") === "1";

if (isDemo) {
  document.title = "Demo — Caption Placement Check";
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", "https://caption-placement-check.sociobot.in/demo/");
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Demo — Caption Placement Check");
}

let videoFile: File | null = null;
let captionFile: File | null = null;
let cues: CaptionCue[] = [];
let findings: Finding[] = [];
let activeFinding: Finding | null = null;
let protectedRegions: Region[] = [];
let drawing = false;
let drawStart: { x: number; y: number } | null = null;
let keyboardRegion: Region = { x: 0.12, y: 0.68, width: 0.76, height: 0.18 };
let currentFilter: "open" | "all" = "open";
let scanCancelled = false;
let videoUrl = "";
let sampleProjectLoaded = false;

function setError(message = "") {
  inputError.textContent = message;
  inputError.hidden = !message;
}

function setFile(kind: "video" | "caption", file?: File) {
  if (!file) return;
  const valid = kind === "video"
    ? file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name)
    : ["text/vtt", "application/x-subrip"].includes(file.type) || /\.(srt|vtt)$/i.test(file.name);
  if (!valid) {
    setError(kind === "video" ? "That does not look like a supported video. Choose MP4, WebM, MOV, or M4V." : "Choose an SRT or WebVTT caption file.");
    return;
  }
  setError();
  if (kind === "video") {
    videoFile = file;
    $("#video-detail").textContent = `${file.name} · ${formatBytes(file.size)}`;
    $("#video-drop").classList.add("has-file");
  } else {
    captionFile = file;
    $("#caption-detail").textContent = `${file.name} · ${formatBytes(file.size)}`;
    $("#caption-drop").classList.add("has-file");
  }
  startButton.disabled = !(videoFile && captionFile);
}

function formatBytes(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

videoInput.addEventListener("change", () => setFile("video", videoInput.files?.[0]));
captionInput.addEventListener("change", () => setFile("caption", captionInput.files?.[0]));

for (const [id, kind] of [["#video-drop", "video"], ["#caption-drop", "caption"]] as const) {
  const drop = $(id);
  for (const event of ["dragenter", "dragover"]) drop.addEventListener(event, (e) => { e.preventDefault(); drop.classList.add("dragging"); });
  for (const event of ["dragleave", "drop"]) drop.addEventListener(event, (e) => { e.preventDefault(); drop.classList.remove("dragging"); });
  drop.addEventListener("drop", (e) => setFile(kind, (e as DragEvent).dataTransfer?.files[0]));
}

function waitFor(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(`Video did not respond while waiting for ${event}.`)), 12000);
    target.addEventListener(event, () => { window.clearTimeout(timeout); resolve(); }, { once: true });
  });
}

async function loadInputs() {
  if (!videoFile || !captionFile) return;
  try {
    cues = parseCaptions(await captionFile.text());
    if (placement.value === "top") cues = cues.map((cue) => ({ ...cue, line: cue.line ?? 8 }));
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    if (video.readyState < 1) await waitFor(video, "loadedmetadata");
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("The video duration could not be read. Try an MP4 or WebM export.");
    const outside = cues.find((cue) => cue.start > video.duration + 1);
    if (outside) throw new Error(`Caption at ${formatTime(outside.start)} is beyond the ${formatTime(video.duration)} video duration.`);
    setError();
    review.hidden = false;
    review.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    await scanVideo();
  } catch (error) {
    setError(error instanceof Error ? error.message : "The files could not be opened.");
  }
}

startButton.addEventListener("click", loadInputs);

function seek(time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.04 && video.readyState >= 2) return Promise.resolve();
  video.currentTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.05));
  return waitFor(video, "seeked");
}

function denseRegions(canvas: HTMLCanvasElement): Region[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return denseRegionsFromPixels(image.data, image.width, image.height);
}

async function faceRegions(canvas: HTMLCanvasElement): Promise<Region[]> {
  const Detector = (window as unknown as { FaceDetector?: new (options: object) => FaceDetectorLike }).FaceDetector;
  if (!Detector) {
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    return fallbackFaceRegions(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  }
  try {
    const faces = await new Detector({ fastMode: true, maxDetectedFaces: 8 }).detect(canvas);
    if (faces.length) return faces.map(({ boundingBox: box }) => ({ x: box.x / canvas.width, y: box.y / canvas.height, width: box.width / canvas.width, height: box.height / canvas.height }));
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    return fallbackFaceRegions(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  } catch {
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    return fallbackFaceRegions(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  }
}

async function scanVideo() {
  scanCancelled = false;
  findings = [];
  activeFinding = null;
  protectedRegions = isDemo || sampleProjectLoaded ? [{ x: 0.12, y: 0.72, width: 0.76, height: 0.2 }] : [];
  if (!isDemo && !sampleProjectLoaded) try {
    protectedRegions = JSON.parse(localStorage.getItem("cpc:protected-regions") || "[]") as Region[];
  } catch { protectedRegions = []; }
  renderFindings();
  $("#progress-wrap").hidden = false;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 320;
  sampleCanvas.height = Math.max(120, Math.round(320 / (video.videoWidth / video.videoHeight || 16 / 9)));
  const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true })!;
  const total = cues.length;

  for (let index = 0; index < total && !scanCancelled; index++) {
    const cue = cues[index];
    await seek((cue.start + cue.end) / 2);
    ctx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const dense = denseRegions(sampleCanvas);
    const faces = await faceRegions(sampleCanvas);
    const cap = captionRegion(cue);
    const candidates: Array<{ region: Region; kind: FindingKind; confidence: number }> = [
      ...faces.map((region) => ({ region, kind: "face" as const, confidence: 0.9 })),
      ...dense.map((region) => ({ region, kind: "dense" as const, confidence: 0.68 })),
      ...protectedRegions.map((region) => ({ region, kind: "protected" as const, confidence: 1 }))
    ];
    const hit = candidates.sort((a, b) => intersectionRatio(cap, b.region) - intersectionRatio(cap, a.region))
      .find((candidate) => intersectionRatio(cap, candidate.region) > (candidate.kind === "face" ? 0.08 : 0.24));
    if (hit) {
      findings.push({ id: `finding-${index}`, cue, kind: hit.kind, confidence: hit.confidence, region: hit.region, captionRegion: cap, recommendation: recommendZone([...dense, ...faces, ...protectedRegions], cap), reviewed: false });
    }
    const percent = Math.round(((index + 1) / total) * 100);
    ($("#scan-progress") as HTMLProgressElement).value = percent;
    $("#progress-value").textContent = `${percent}%`;
    $("#progress-text").textContent = `Sampling cue ${index + 1} of ${total}`;
    if (index % 4 === 0) renderFindings();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  $("#progress-wrap").hidden = true;
  updateScanSummary();
  renderFindings();
  if (findings[0]) selectFinding(findings[0]);
  else { await seek(0); drawOverlay(); }
}

function updateScanSummary() {
  $("#scan-summary").textContent = `${cues.length} cues sampled · ${findings.length} ${findings.length === 1 ? "cue needs" : "cues need"} a closer look`;
}

function reasonLabel(kind: FindingKind) {
  return kind === "face" ? "Possible face overlap" : kind === "protected" ? "Protected region overlap" : "Dense visual overlap";
}

function renderFindings() {
  const list = $("#findings") as HTMLOListElement;
  const visible = findings.filter((item) => currentFilter === "all" || !item.reviewed);
  list.replaceChildren(...visible.map((item) => {
    const li = document.createElement("li");
    li.className = `finding${activeFinding?.id === item.id ? " selected" : ""}${item.reviewed ? " reviewed" : ""}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "finding-main";
    button.innerHTML = `<span class="finding-time">${formatTime(item.cue.start)}</span><span class="finding-reason"><span class="warning-dot" aria-hidden="true">!</span>${reasonLabel(item.kind)}</span><q>${escapeHtml(item.cue.text)}</q><span class="recommendation">${escapeHtml(item.recommendation)}</span>`;
    button.addEventListener("click", () => selectFinding(item));
    const reviewButton = document.createElement("button");
    reviewButton.type = "button";
    reviewButton.className = "review-toggle";
    reviewButton.textContent = item.reviewed ? "Reopen" : "Mark reviewed";
    reviewButton.setAttribute("aria-pressed", String(item.reviewed));
    reviewButton.addEventListener("click", () => { item.reviewed = !item.reviewed; renderFindings(); });
    li.append(button, reviewButton);
    return li;
  }));
  $("#open-count").textContent = String(findings.filter((item) => !item.reviewed).length);
  $("#all-count").textContent = String(findings.length);
  $("#no-findings").hidden = findings.length !== 0;
}

function escapeHtml(value: string) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

async function selectFinding(item: Finding) {
  activeFinding = item;
  await seek(item.cue.start);
  $("#caption-preview").textContent = item.cue.text;
  const cap = item.captionRegion;
  const preview = $("#caption-preview");
  preview.style.left = `${cap.x * 100}%`;
  preview.style.top = `${cap.y * 100}%`;
  preview.style.width = `${cap.width * 100}%`;
  drawOverlay();
  renderFindings();
}

function drawOverlay(temp?: Region) {
  const rect = stage.getBoundingClientRect();
  const ratio = video.videoWidth / video.videoHeight || 16 / 9;
  let width = rect.width, height = width / ratio;
  if (height > rect.height) { height = rect.height; width = height * ratio; }
  overlay.width = Math.round(width);
  overlay.height = Math.round(height);
  overlay.style.width = `${width}px`;
  overlay.style.height = `${height}px`;
  const ctx = overlay.getContext("2d")!;
  const paint = (region: Region, color: string, dashed = false) => {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = `${color}22`; ctx.lineWidth = 3;
    if (dashed) ctx.setLineDash([8, 6]);
    ctx.fillRect(region.x * width, region.y * height, region.width * width, region.height * height);
    ctx.strokeRect(region.x * width, region.y * height, region.width * width, region.height * height); ctx.restore();
  };
  protectedRegions.forEach((region) => paint(region, "#80d8b2"));
  if (activeFinding) { paint(activeFinding.region, "#ffd36a", true); paint(activeFinding.captionRegion, "#ff8178"); }
  if (temp) paint(temp, "#80d8b2");
}

window.addEventListener("resize", () => drawOverlay());
video.addEventListener("timeupdate", () => {
  const cue = cues.find((item) => item.start <= video.currentTime && item.end >= video.currentTime);
  if (cue) $("#caption-preview").textContent = cue.text;
  else if (!video.paused) $("#caption-preview").textContent = "";
});

$("#mark-region").addEventListener("click", (event) => {
  drawing = !drawing;
  (event.currentTarget as HTMLButtonElement).setAttribute("aria-pressed", String(drawing));
  stage.classList.toggle("drawing-region", drawing);
  overlay.tabIndex = drawing ? 0 : -1;
  overlay.setAttribute("aria-label", drawing ? "Protected region editor. Use arrow keys to move the highlighted region, then press Enter to add it. Press Escape to stop marking." : "Protected region editor is inactive.");
  if (drawing) {
    keyboardRegion = { x: 0.12, y: 0.68, width: 0.76, height: 0.18 };
    drawOverlay(keyboardRegion);
    overlay.focus();
  }
  $("#region-help").textContent = drawing ? "Drag across the video, or use arrow keys to move the keyboard region and Enter to add it." : "Add an interpreter, slide, or sign that automation may miss.";
});

function addProtectedRegion(region: Region) {
  if (region.width <= 0.03 || region.height <= 0.03) return;
  protectedRegions.push(region);
  for (const [index, cue] of cues.entries()) {
    const cap = captionRegion(cue);
    if (intersectionRatio(cap, region) > 0.08 && !findings.some((item) => item.cue.id === cue.id && item.kind === "protected"))
      findings.push({ id: `protected-${index}`, cue, kind: "protected", confidence: 1, region, captionRegion: cap, recommendation: recommendZone([region], cap), reviewed: false });
  }
  updateScanSummary();
  renderFindings();
  drawOverlay();
}

overlay.addEventListener("pointerdown", (event) => {
  if (!drawing) return;
  overlay.setPointerCapture(event.pointerId);
  drawStart = { x: event.offsetX / overlay.clientWidth, y: event.offsetY / overlay.clientHeight };
});
overlay.addEventListener("pointermove", (event) => {
  if (!drawing || !drawStart) return;
  const x = event.offsetX / overlay.clientWidth, y = event.offsetY / overlay.clientHeight;
  drawOverlay({ x: Math.min(x, drawStart.x), y: Math.min(y, drawStart.y), width: Math.abs(x - drawStart.x), height: Math.abs(y - drawStart.y) });
});
overlay.addEventListener("pointerup", (event) => {
  if (!drawing || !drawStart) return;
  const x = event.offsetX / overlay.clientWidth, y = event.offsetY / overlay.clientHeight;
  const region = { x: Math.min(x, drawStart.x), y: Math.min(y, drawStart.y), width: Math.abs(x - drawStart.x), height: Math.abs(y - drawStart.y) };
  drawStart = null;
  addProtectedRegion(region);
});

overlay.addEventListener("keydown", (event) => {
  if (!drawing) return;
  const step = event.shiftKey ? 0.1 : 0.04;
  const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addProtectedRegion({ ...keyboardRegion });
    $("#region-help").textContent = "Protected region added. Use arrow keys to place another, or Escape to stop marking.";
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    $("#mark-region").click();
    $("#mark-region").focus();
    return;
  }
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  keyboardRegion.x = Math.min(1 - keyboardRegion.width, Math.max(0, keyboardRegion.x + move[0]));
  keyboardRegion.y = Math.min(1 - keyboardRegion.height, Math.max(0, keyboardRegion.y + move[1]));
  drawOverlay(keyboardRegion);
});

document.querySelectorAll<HTMLButtonElement>(".filter").forEach((button) => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter as "open" | "all";
  document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
  renderFindings();
}));

function download(name: string, type: string, value: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([value], { type })); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

$("#export-csv").addEventListener("click", () => download("caption-placement-findings.csv", "text/csv", findingToCsv(findings)));
$("#new-check").addEventListener("click", () => { scanCancelled = true; location.href = isDemo ? "/demo/" : "/check/"; });

const LICENSE_KEY = "sb_license:caption-placement-check";
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const BILLING_API = "https://api.sociobot.in/api/v1/products/caption-placement-check";

function setStudio(active: boolean, message: string) {
  document.body.classList.toggle("studio-unlocked", active);
  document.querySelectorAll<HTMLButtonElement>(".studio-only").forEach((button) => { button.disabled = !active; });
  const licenseStatus = document.querySelector("#license-status");
  if (licenseStatus) licenseStatus.textContent = message;
  const buy = document.querySelector<HTMLAnchorElement>("#buy-link");
  if (active && buy) buy.textContent = "Studio unlocked";
}

async function verifyLicense(token: string, force = false) {
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || "null") as { valid?: boolean; checked?: number } | null;
  if (!force && cached?.valid && cached.checked && Date.now() - cached.checked < 86_400_000) { setStudio(true, "Studio is active on this device."); return; }
  if (cached?.valid) setStudio(true, "Studio is active; checking the license in the background…");
  if (!navigator.onLine) { setStudio(Boolean(cached?.valid), cached?.valid ? "Studio is active from the last check. You are offline." : "Connect once to verify a Studio license."); return; }
  try {
    const response = await fetch(`${BILLING_API}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error("Verification service unavailable");
    const result = await response.json() as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    setStudio(result.valid, result.valid ? "Studio is active on this device." : "This license is no longer active. Buy or restore another license.");
  } catch { setStudio(Boolean(cached?.valid), "Could not reach license verification. The free checker is still available."); }
}

const queryLicense = new URLSearchParams(location.search).get("license");
if (queryLicense) { localStorage.setItem(LICENSE_KEY, queryLicense); history.replaceState({}, "", location.pathname + location.hash); }
const savedLicense = queryLicense || localStorage.getItem(LICENSE_KEY);
if (savedLicense) void verifyLicense(savedLicense);

document.querySelector("#restore-license")?.addEventListener("click", () => { $("#license-form").hidden = false; ($("#license-token") as HTMLInputElement).focus(); });
document.querySelector("#license-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ($("#license-token") as HTMLInputElement).value.trim();
  if (!token) { $("#license-status").textContent = "Paste the license token from your receipt."; return; }
  localStorage.setItem(LICENSE_KEY, token); void verifyLicense(token, true);
});

$("#save-preset").addEventListener("click", () => {
  if (isDemo) { $("#region-help").textContent = "Demo changes are kept only for this sample review."; return; }
  if (!protectedRegions.length) { $("#region-help").textContent = "Mark at least one protected region before saving a preset."; return; }
  localStorage.setItem("cpc:protected-regions", JSON.stringify(protectedRegions));
  $("#region-help").textContent = `${protectedRegions.length} protected ${protectedRegions.length === 1 ? "region" : "regions"} saved for future checks.`;
});

$("#export-json").addEventListener("click", () => download("caption-placement-project.json", "application/json", JSON.stringify({
  schema: 1, createdAt: new Date().toISOString(), video: videoFile ? { name: videoFile.name, duration: video.duration } : null,
  captionFile: captionFile?.name, protectedRegions, findings
}, null, 2)));

window.addEventListener("offline", () => { document.querySelector(".local-badge")!.innerHTML = "<span aria-hidden=\"true\">●</span> Offline · local checks still work"; });
window.addEventListener("online", () => { document.querySelector(".local-badge")!.innerHTML = "<span aria-hidden=\"true\">●</span> Checks media on this device"; });

async function loadSampleProject() {
  // Vite copies the shipped sample under public/demo/. This relative form
  // works in the Tauri asset bundle and in the copied /check/ web shell.
  const sampleBase = isDemo ? "/demo/" : "./demo/";
  const [videoResponse, captionResponse] = await Promise.all([fetch(`${sampleBase}sample.webm`), fetch(`${sampleBase}sample.srt`)]);
  if (!videoResponse.ok || !captionResponse.ok) throw new Error("Sample files were unavailable");
  sampleProjectLoaded = true;
  setFile("video", new File([await videoResponse.blob()], "sample-lesson.webm", { type: "video/webm" }));
  setFile("caption", new File([await captionResponse.blob()], "sample-lesson.srt", { type: "application/x-subrip" }));
  await loadInputs();
}

document.querySelector("#load-sample")?.addEventListener("click", async () => {
  try { await loadSampleProject(); } catch { setError("The sample could not load. Choose your own local files instead."); }
});

async function startDemo() {
  const banner = document.createElement("aside");
  banner.className = "demo-banner";
  banner.setAttribute("aria-label", "Demo mode");
  banner.innerHTML = "<strong>Demo — sample data, nothing is saved</strong><span>Two short caption cues are ready to inspect.</span><button type=\"button\">Reset demo</button><a href=\"/check/\">Start for real</a>";
  document.body.prepend(banner);
  banner.querySelector("button")!.addEventListener("click", () => { location.href = "/demo/"; });
  try {
    await loadSampleProject();
  } catch {
    setError("The sample could not load. Reset the demo or try the browser checker with your own files.");
  }
}

if (isDemo) void startDemo();

if ("serviceWorker" in navigator) window.addEventListener("load", () => {
  void navigator.serviceWorker.register("/sw.js").then(async () => {
    await navigator.serviceWorker.ready;
    // The worker installs the complete checker and demo shells before it
    // becomes ready. Keeping the page out of that cache transaction avoids
    // racing a blob preview URL into the same cache during first-run setup.
    document.documentElement.dataset.offlineReady = "true";
  }).catch(() => undefined);
});
