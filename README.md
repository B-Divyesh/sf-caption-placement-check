# Caption Placement Check

Caption Placement Check is a local-first accessibility preflight for solo educators, creators, and small publishing teams. Pair a final video with SRT or WebVTT captions; the app samples each timed cue, flags overlap with faces and visually dense regions, recommends an alternate zone, and produces a review list.

It is intentionally not a transcription tool or compliance certificate. A human should watch the final export.

Live site and browser checker: <https://caption-placement-check.sociobot.in>

## What it does

- Processes video and caption files locally—media is never uploaded.
- Parses SRT and WebVTT, including cue position settings and non-Latin text.
- Uses the platform face detector when available and a script-agnostic edge-density heuristic everywhere.
- Lets a reviewer draw protected regions for interpreters, slides, signs, or other meaningful content.
- Exports the review list as CSV for free.
- Offers an optional $19 one-time Studio license for reusable region presets and JSON project reports. Checkout and verification use the Sociobot billing API.

## Run locally

Requirements: Node.js 22+, npm, and—for the desktop shell—Rust plus the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/).

```sh
npm ci
npm run dev          # desktop UI in a browser at localhost:1420
npm run dev:site     # landing page
npm run tauri dev    # native desktop window
```

## Test and build

```sh
npm test             # parser and placement unit tests
npm run test:e2e     # production-site, axe, keyboard, mobile, and local scan tests
npm run check        # TypeScript plus Rust checks
npm run build        # exact static deploy output: dist/site/index.html
npm run tauri build  # native bundle for the current platform
```

The release workflow is the source of platform binaries. Tag `v*` or dispatch `.github/workflows/release.yml`; GitHub Actions builds macOS arm64/x64, Windows x64, and Linux x64 bundles and publishes `SHA256SUMS` plus `latest.json`.

## Install

The landing page detects macOS, Windows, or Linux and resolves its primary button from the latest release manifest. Terminal installers download and verify SHA-256 before opening/installing the matching asset:

```sh
curl -fsSL https://caption-placement-check.sociobot.in/install.sh | sh
```

```powershell
irm https://caption-placement-check.sociobot.in/install.ps1 | iex
```

Early desktop builds are unsigned. On macOS, right-click the app and choose **Open**. On Windows, review the SmartScreen prompt before continuing.

## Privacy and architecture

The app has no telemetry or advertising analytics, uses no runtime CDN resources, and stores only a license token, cached verification verdict, and optional Studio preset locally. See [`site/privacy/index.html`](site/privacy/index.html) and [`site/terms/index.html`](site/terms/index.html).

The visual rationale, asset prompt, and provenance are documented in [`.factory/design.md`](.factory/design.md). The software is MIT licensed.
