import "./styles.css";
import {
  captionRegion, findingToCsv, formatTime, intersectionRatio, parseCaptions, recommendZone,
  type CaptionCue, type Finding, type FindingKind, type Region
} from "./captions";

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

let videoFile: File | null = null;
let captionFile: File | null = null;
let cues: CaptionCue[] = [];
let findings: Finding[] = [];
let activeFinding: Finding | null = null;
let protectedRegions: Region[] = [];
let drawing = false;
let drawStart: { x: number; y: number } | null = null;
let currentFilter: "open" | "all" = "open";
let scanCancelled = false;
let videoUrl = "";

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
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cols = 8, rows = 6, cellW = Math.floor(width / cols), cellH = Math.floor(height / rows);
  const regions: Region[] = [];
  const lum = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let edges = 0, samples = 0, horizontalRuns = 0;
      for (let y = row * cellH + 2; y < Math.min(height - 2, (row + 1) * cellH); y += 2) {
        let rowEdges = 0;
        for (let x = col * cellW + 2; x < Math.min(width - 2, (col + 1) * cellW); x += 2) {
          const gx = Math.abs(lum(x + 1, y) - lum(x - 1, y));
          const gy = Math.abs(lum(x, y + 1) - lum(x, y - 1));
          if (gx + gy > 82) { edges++; rowEdges++; }
          samples++;
        }
        if (rowEdges >= 3) horizontalRuns++;
      }
      const density = edges / Math.max(1, samples);
      if (density > 0.18 && horizontalRuns >= 3) regions.push({ x: col / cols, y: row / rows, width: 1 / cols, height: 1 / rows });
    }
  }
  return regions;
}

async function faceRegions(canvas: HTMLCanvasElement): Promise<Region[]> {
  const Detector = (window as unknown as { FaceDetector?: new (options: object) => FaceDetectorLike }).FaceDetector;
  if (!Detector) return [];
  try {
    const faces = await new Detector({ fastMode: true, maxDetectedFaces: 8 }).detect(canvas);
    return faces.map(({ boundingBox: box }) => ({ x: box.x / canvas.width, y: box.y / canvas.height, width: box.width / canvas.width, height: box.height / canvas.height }));
  } catch { return []; }
}

async function scanVideo() {
  scanCancelled = false;
  findings = [];
  activeFinding = null;
  protectedRegions = [];
  try {
    const cachedVerdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || "null") as { valid?: boolean } | null;
    if (cachedVerdict?.valid) protectedRegions = JSON.parse(localStorage.getItem("cpc:protected-regions") || "[]") as Region[];
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
      ...dense.map((region) => ({ region, kind: "dense" as const, confidence: 0.68 }))
    ];
    const hit = candidates.sort((a, b) => intersectionRatio(cap, b.region) - intersectionRatio(cap, a.region))
      .find((candidate) => intersectionRatio(cap, candidate.region) > (candidate.kind === "face" ? 0.08 : 0.24));
    if (hit) {
      findings.push({ id: `finding-${index}`, cue, kind: hit.kind, confidence: hit.confidence, region: hit.region, captionRegion: cap, recommendation: recommendZone([...dense, ...faces], cap), reviewed: false });
    }
    const percent = Math.round(((index + 1) / total) * 100);
    ($("#scan-progress") as HTMLProgressElement).value = percent;
    $("#progress-value").textContent = `${percent}%`;
    $("#progress-text").textContent = `Sampling cue ${index + 1} of ${total}`;
    if (index % 4 === 0) renderFindings();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  $("#progress-wrap").hidden = true;
  $("#scan-summary").textContent = `${cues.length} cues sampled · ${findings.length} ${findings.length === 1 ? "cue needs" : "cues need"} a closer look`;
  renderFindings();
  if (findings[0]) selectFinding(findings[0]);
  else { await seek(0); drawOverlay(); }
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
  $("#region-help").textContent = drawing ? "Drag across the video to mark what captions must avoid." : "Add an interpreter, slide, or sign that automation may miss.";
});

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
  if (region.width > 0.03 && region.height > 0.03) {
    protectedRegions.push(region);
    for (const [index, cue] of cues.entries()) {
      const cap = captionRegion(cue);
      if (intersectionRatio(cap, region) > 0.08 && !findings.some((item) => item.cue.id === cue.id && item.kind === "protected"))
        findings.push({ id: `protected-${index}`, cue, kind: "protected", confidence: 1, region, captionRegion: cap, recommendation: recommendZone([region], cap), reviewed: false });
    }
    renderFindings(); drawOverlay();
  }
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
$("#new-check").addEventListener("click", () => { scanCancelled = true; location.reload(); });

const LICENSE_KEY = "sb_license:caption-placement-check";
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const API = "https://api.sociobot.in/api/v1/products/caption-placement-check";

function setStudio(active: boolean, message: string) {
  document.body.classList.toggle("studio-unlocked", active);
  document.querySelectorAll<HTMLButtonElement>(".studio-only").forEach((button) => { button.disabled = !active; });
  $("#license-status").textContent = message;
  if (active) $("#buy-link").textContent = "Studio unlocked";
}

async function verifyLicense(token: string, force = false) {
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || "null") as { valid: boolean; checked: number } | null;
  if (!force && cached?.valid && Date.now() - cached.checked < 86_400_000) { setStudio(true, "Studio is active on this device."); return; }
  if (cached?.valid) setStudio(true, "Studio is active; checking the license in the background…");
  if (!navigator.onLine) { $("#license-status").textContent = cached?.valid ? "Studio is active from the last check. You are offline." : "Connect to the internet once to verify this license."; return; }
  try {
    const response = await fetch(`${API}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error("Verification service unavailable");
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    setStudio(result.valid, result.valid ? "Studio is active on this device." : "This license is no longer active. You can buy or restore another license.");
  } catch { $("#license-status").textContent = "Could not reach license verification. The free checker is still available."; }
}

const queryLicense = new URLSearchParams(location.search).get("license");
if (queryLicense) {
  localStorage.setItem(LICENSE_KEY, queryLicense);
  history.replaceState({}, "", location.pathname + location.hash);
}
const savedLicense = queryLicense || localStorage.getItem(LICENSE_KEY);
if (savedLicense) void verifyLicense(savedLicense);

$("#restore-license").addEventListener("click", () => { $("#license-form").hidden = false; ($("#license-token") as HTMLInputElement).focus(); });
$("#license-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ($("#license-token") as HTMLInputElement).value.trim();
  if (!token) { $("#license-status").textContent = "Paste the license token from your receipt."; return; }
  localStorage.setItem(LICENSE_KEY, token); void verifyLicense(token, true);
});

$("#save-preset").addEventListener("click", () => {
  if (!protectedRegions.length) { $("#region-help").textContent = "Mark at least one protected region before saving a preset."; return; }
  localStorage.setItem("cpc:protected-regions", JSON.stringify(protectedRegions));
  $("#region-help").textContent = `${protectedRegions.length} protected ${protectedRegions.length === 1 ? "region" : "regions"} saved for future checks.`;
});

$("#export-json").addEventListener("click", () => download("caption-placement-project.json", "application/json", JSON.stringify({
  schema: 1, createdAt: new Date().toISOString(), video: videoFile ? { name: videoFile.name, duration: video.duration } : null,
  captionFile: captionFile?.name, protectedRegions, findings
}, null, 2)));

window.addEventListener("offline", () => { document.querySelector(".local-badge")!.innerHTML = "<span aria-hidden=\"true\">●</span> Offline · local checks still work"; });
window.addEventListener("online", () => { document.querySelector(".local-badge")!.innerHTML = "<span aria-hidden=\"true\">●</span> Media stays on this device"; });
