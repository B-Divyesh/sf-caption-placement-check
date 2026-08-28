# Caption Placement Check

Check caption placement on a video before publishing. The app flags captions that overlap faces, text, or a region you mark.

It suggests a safer position and builds a list of alerts. It does not transcribe video or certify legal compliance.

Live product: <https://caption-placement-check.sociobot.in>

Try the isolated sample: <https://caption-placement-check.sociobot.in/?demo=1>. It opens two alerts and does not read or save your checker data.

## What it does

- Processes chosen video and caption files on your device.
- Reads SRT and WebVTT files, including positioned captions.
- Keeps Arabic, Japanese, and other Unicode caption text in alerts and exports.
- Checks for faces and visually busy regions.
- Lets you mark protected regions with a pointer or keyboard.
- Suggests a safer caption position for each alert.
- Exports alerts as CSV and project details as JSON without an account.

## Run locally

Install Node.js 22+, npm, Rust, and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/) (external).

```sh
npm ci
npm run dev          # desktop UI in a browser at localhost:1420
npm run dev:site     # landing page
npm run tauri dev    # native desktop window
```

## Test and build

```sh
npm test
npm run test:e2e
npm run test:benchmark
npm run check
npm run build
```

`npm run build` creates the static deployment in `dist/site/`. The Tauri workflow builds the desktop packages from tags named `v*`.

## Install

The download page selects the matching operating system and architecture when the browser provides them. If release data is unavailable, it links to GitHub Releases.

Current releases provide macOS, Windows, and Linux builds with published checksums. The terminal installers compare every download with its SHA-256 value.

```sh
curl -fsSL https://caption-placement-check.sociobot.in/install.sh | sh
```

```powershell
irm https://caption-placement-check.sociobot.in/install.ps1 | iex
```

Current builds have no publisher signature. On macOS, right-click the app and choose **Open**. On Windows, review the SmartScreen prompt.

## Privacy

The checker does not upload chosen media. Saved protected regions stay in browser storage until you clear site data.

The demo does not read or change saved regions or other real-data keys. The public site uses no advertising or behavioral analytics.

See [Privacy](site/privacy/index.html) and [Terms](site/terms/index.html).

## Validation and source license

The automated benchmark uses the labelled 30-video set documented in [`.factory/benchmark.md`](.factory/benchmark.md). Detection remains advisory; watch the final export.

The visual rationale and asset provenance are in [`.factory/design.md`](.factory/design.md). The software uses the MIT license in [LICENSE](LICENSE).
