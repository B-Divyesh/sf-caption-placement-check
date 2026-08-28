# Caption Placement Check v0.1.0 — handoff

## What was built

- A real local SRT/WebVTT plus video review flow in the browser and Tauri 2 desktop shell.
- Validated caption parsing (including cue settings, multiline cues, and non-Latin text), cue-by-cue frame sampling, native `FaceDetector` use where available, and a platform-independent edge-density heuristic for text/dense visuals.
- An inspectable review list with exact timecodes, confidence/reason labels, alternate-zone recommendations, video seeking, reviewed/open state, and free CSV export.
- Manual protected-region drawing for sign-language interpreters, slides, signs, and meaningful content automation misses.
- Free core experience plus an optional $19 one-time Studio unlock for reusable protected-region presets and JSON project reports. License capture, daily verification cache, offline optimistic unlock, revocation handling, and paste-to-restore follow the Sociobot billing contract.
- A responsive landing/download site with OS detection, browser-checker route, `/privacy/`, `/terms/`, service-worker shell caching, terminal installers, and a release-manifest fallback.
- Tauri icons and a GitHub Actions release matrix for macOS arm64/x64, Windows x64, and Linux x64. Release artifacts include DMG, MSI/EXE, AppImage, DEB/RPM where Tauri supports them, `SHA256SUMS`, and `latest.json`.
- A product-specific cinematic projection-room visual system and original generated hero. Prompt, generator, source, and license provenance are in `.factory/design.md` and `assets/src/`.

## How to run and verify

```sh
npm ci
npm test
npm run test:e2e
npm run check
npm run build
```

`npm run build` is the exact static deployment command. The deploy root is `dist/site/`, with `dist/site/index.html` present. The Tauri workflow runs `npm run build:app` and packages `dist/app/`.

Verification completed on 2026-08-28:

- `npm test`: 7/7 unit tests passed.
- `npm run test:e2e`: 4/4 Chromium tests passed, including production routing, keyboard/axe checks, 390px viewport, and an actual local WebM + SRT scan.
- `npm run check`: TypeScript strict check and `cargo check` passed.
- `npm audit`: 0 vulnerabilities.
- Production sizes: landing JS 2.39 KB, combined landing CSS 20.32 KB, checker JS 14.61 KB, checker CSS 11.92 KB, hero WebP 23.02 KB. All are uncompressed and below the stated budgets.
- Lighthouse mobile (local production preview): Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1s, CLS 0, total blocking time 0ms.
- Manual visual review completed at 1440×900 and 390×844. Generated art was checked for text artifacts, brands, anatomy, seams, and palette consistency.
- Install script syntax: `sh -n public/install.sh` passes. The scripts verify the selected release asset against `latest.json` before installing/opening it.

## Product and technical limits

- Face detection depends on the operating system webview’s native `FaceDetector`. Where it is unavailable, the dense-region heuristic and manual protected regions remain available and the product does not pretend a face model ran.
- Dense-region detection is script-agnostic and has unit coverage with non-Latin caption text, but the researched 30-video labeled benchmark was not supplied. The brief’s ≥85% critical-overlap recall / false-alert target is therefore not claimed as measured. Run that benchmark before making accuracy claims.
- Samples are taken at each caption cue midpoint. Rapid movement inside a long cue can require human playback or splitting the cue.
- The first release is unsigned. macOS Gatekeeper and Windows SmartScreen can show warnings. The landing page and README disclose this.
- No updater is included, so no updater manifest is shipped.

## Needs operator action

1. Register the paid product slug `caption-placement-check` with the Sociobot billing factory, price it at USD $19 one-time, and set its return URL to `https://caption-placement-check.sociobot.in/check/`. The code intentionally contains no hardcoded billing product ID.
2. Verify the `v0.1.0` GitHub Actions run finishes and that all release assets are public. Download one asset and compare it with `SHA256SUMS`; also validate `latest.json` with `python3 -m json.tool`.
3. Deploy `dist/site/` to the product hostname. The page’s release-manifest fetch is enabled only at `caption-placement-check.sociobot.in`, avoiding noisy cross-origin failures in local development.
4. For signed releases, configure Apple notarization and Windows Authenticode. Certificate material is not present and must never be committed. Expected secret names for that future workflow wiring are `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and `WINDOWS_CERT_PASSWORD`. The current workflow deliberately builds unsigned and consumes none of them.
5. Run the labeled 30-video accuracy set, including non-Latin on-screen scripts and sign-language layouts; tune `denseRegions` thresholds from measured results.

## Next sensible improvements

- Add bundled face/text models only if they remain local, materially outperform native/heuristic detection, and stay within an acceptable desktop package budget.
- Add start/mid/end samples for long cues and merge neighboring findings into intervals.
- Add a reviewer-authored per-video preset chooser and editable finding notes.
