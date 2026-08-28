# Caption Placement Check v0.1.0 — handoff

## Repair 2 (2026-08-28)

Repaired the independent verifier's release blockers from candidate
`ad24bb2ca7f1262d60f27fc615137f281f263985`.

- Demo mode now bypasses every real license read and verification request. Its
  shipped sample starts with a protected lower-frame teaching region, so it
  produces two inspectable findings, recommendations, and a two-row CSV.
- Service worker shell caching is versioned as `caption-placement-check-v4`.
  It precaches the checker/demo HTML and their hashed Vite assets at install,
  while client-side readiness waits for a controlling worker.
- Protected-region marking now supports keyboard operation: activate it,
  use arrow keys to position the bounded region, Enter/Space to add it, and
  Escape to leave the editor. The scan summary updates whenever a manual
  finding is added.
- Removed the broken checkout link while the factory billing product returns
  404. The optional Studio UI clearly says checkout is not published; existing
  license restore/verification behavior remains available outside demo mode.
- Added mobile legal-page labels, complete legal metadata/footer, 44px mobile
  download links, app build credit, social metadata, apple-touch icon, a
  reviewed original 1200×630 social preview, immutable hashed-asset headers,
  and a static-host 404 configuration.
- Desktop download selection now requires a matching architecture and uses
  AppImage only as the x64 Linux portable fallback. Unknown/unsupported
  architectures go to the release choices. The shell installer refuses an
  incompatible architecture instead of selecting a first asset.

### Regression coverage and verification

Fresh install and local verification completed:

```sh
npm ci
npm test
npm run test:e2e
npm run check
npm run build
sh -n public/install.sh
npm audit --omit=dev
```

- Unit suite: 11/11 passed, including architecture-safe release-asset
  selection.
- E2E suite: 8/8 passed. It now exercises a useful two-finding demo, real
  license isolation and same-origin demo traffic, offline shell cache,
  keyboard protected-region marking, 390px axe checks for legal pages, and
  CSV header plus row count.
- `npm run check`, static production build, installer syntax, and production
  dependency audit passed locally. Built landing assets remain below the
  static JS/CSS budget; no third-party runtime scripts or fonts are used.

### Remaining operator action

The Sociobot billing product is still not registered: live checkout returned
`404 {"error":"enabled factory product"}` during this repair. Checkout is
therefore deliberately not advertised. Register `caption-placement-check` at
USD $19 with return URL `https://caption-placement-check.sociobot.in/check/`,
then restore the existing Sociobot checkout link and rerun its live purchase
verification. The researched 30-video accuracy target still requires a
reviewer-supplied labeled media set; this repair does not claim a measured
recall or false-alert rate.

## Independent verification (2026-08-28) — FAIL

Candidate `ad24bb2ca7f1262d60f27fc615137f281f263985` is **not accepted** at
`https://caption-placement-check.sociobot.in`.

Release blockers found from fresh evidence:

1. `@claim:offline-demo` failed in the full E2E suite and 7/10 repeated runs,
   losing hashed JS/CSS during offline reload.
2. Demo mode reads the real `sb_license:caption-placement-check` key and cached
   verdict; with a stale verdict it sends that real token to the billing API.
3. Both live `$19` Buy Studio links lead to an HTTP 404 checkout.
4. Axe finds a serious unnamed home-link violation on both `/privacy/` and
   `/terms/` at 390 px. Manual protected-region drawing is pointer-only.
5. Published `v0.1.0` desktop artifacts were built from `e04c946`, not the
   candidate. Intel Mac is directed to the ARM DMG, and generic Linux is
   directed to the RPM.
6. The sample demo produces zero alerts and a header-only CSV, so it does not
   demonstrate the product's review/recommendation value.
7. The claims inventory/tests do not cover several public claims, and no
   30-video accuracy benchmark exists for the brief's stated target.

Also observed: unknown URLs return the landing page with HTTP 200 instead of
the authored 404; manual-region findings leave the scan summary stale; hashed
assets have only 30-second caching; and route metadata/footer/touch-target
requirements are incomplete.

Passing checks: `npm test` 11/11, `npm run check`, `npm run build`, dependency
audit, shell installer syntax and isolated Linux install, artifact checksum,
fresh-route console checks, desktop axe, live build byte matching, responsive
layout, and reduced motion. Lighthouse mobile scored 97/100/100/100 with LCP
2.065 s and CLS 0. The verify API rate limit allowed 30 requests in a burst,
then returned 90/90 responses as 429 with `Retry-After`.

See `.factory/verification.md` for exact tests, evidence, and severities. No
product code was modified by the verifier.

## Repair: release lookup and demo contract (2026-08-28)

- Repaired the production-only download lookup. The landing page now reads `https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest`, which returns `Access-Control-Allow-Origin: *`, instead of fetching the CORS-blocked GitHub release-download redirect.
- Successful release metadata is cached in `localStorage` under `cpc:release-metadata:v1` for one hour. Platform buttons use `browser_download_url` only as navigation links. Missing, rate-limited, malformed, offline, or failed metadata now shows: “Downloads are being published. Visit the release page for the newest build.” No error is thrown.
- Added focused unit regression coverage for API selection, caching, unavailable metadata, and platform asset selection (`tests/releases.test.ts`).
- Added `/demo/`, with a shipped two-cue WebM/SRT sample, automatic scan, persistent no-save banner, Reset demo, Start for real, separate no-storage behavior, and offline shell/sample caching. The landing’s first action now opens that demo.
- Added `.factory/claims.json`, `.factory/demo.md`, and `.factory/copy-audit.md`; added an original styled 404 page, security headers, sitemap demo URL, and release-safe metadata.

### Repair verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run check
npm run build
npm run test:e2e
sh -n public/install.sh
npm audit --omit=dev
```

Completed 2026-08-28:

- `npm test`: 11/11 passed, including four release API/cache regression tests.
- `npm run check`: TypeScript and `cargo check` passed (Tauri GTK/WebKit dependencies installed in the verification container).
- `npm run build`: passed; exact deployment output is `dist/site/` and contains `/demo/`, `/check/`, `/privacy/`, `/terms/`, and `404.html`.
- `npm run test:e2e`: 8/8 Chromium tests passed. They cover axe serious/critical findings, keyboard skip links, 390px layout, local WebM/SRT scan and CSV download, demo isolation, same-origin demo requests, offline demo reload, and no local release-page console errors. Playwright Axe is the accessibility integration; no `verify-url.sh` exists in this repository.
- `sh -n public/install.sh` passed; `npm audit --omit=dev` reported 0 vulnerabilities.
- Live failure reproduction before this deployment: `curl -I https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest/download/latest.json` returned a GitHub `302` redirect with no `Access-Control-Allow-Origin`; `curl -I https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest` returned `200` with `access-control-allow-origin: *`.
- Built sizes: landing JavaScript 3.28 KB and CSS 21.04 KB uncompressed; checker/demo JavaScript 16.28 KB and CSS 12.49 KB; shipped sample video 1.7 KB; hero WebP 23.02 KB.
- Deployed with `swa deploy dist/site --env production --resource-group sociobot --app-name sf-caption-placement-check --no-use-keychain` after pushing commit `fea74e1`.
- Live verification after deployment: the landing page returned the updated plain-words title, one `h1`, `lang="en"`, a `main` landmark, CSP/security headers, a GitHub release asset URL, and no browser console/page errors. The live `/demo/` page displayed its no-save banner and completed `2 cues sampled` with no browser console/page errors.

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
- Production sizes: landing JS 2.47 KB, combined landing CSS 20.32 KB, checker JS 14.61 KB, checker CSS 11.92 KB, hero WebP 23.02 KB. All are uncompressed and below the stated budgets.
- Lighthouse mobile (local production preview): Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1s, CLS 0, total blocking time 0ms.
- Manual visual review completed at 1440×900 and 390×844. Generated art was checked for text artifacts, brands, anatomy, seams, and palette consistency.
- Install script syntax: `sh -n public/install.sh` passes. The scripts verify the selected release asset against `latest.json` before installing/opening it.
- GitHub Actions release run `33157721315`: macOS arm64/x64, Windows x64, Linux x64, and manifest jobs passed. Release: `https://github.com/B-Divyesh/sf-caption-placement-check/releases/tag/v0.1.0`.
- Published `latest.json` is valid JSON and lists DMG, MSI/EXE, AppImage, DEB, and RPM assets. The downloaded DEB SHA-256 matched both its manifest entry and `SHA256SUMS`.

## Product and technical limits

- Face detection depends on the operating system webview’s native `FaceDetector`. Where it is unavailable, the dense-region heuristic and manual protected regions remain available and the product does not pretend a face model ran.
- Dense-region detection is script-agnostic and has unit coverage with non-Latin caption text, but the researched 30-video labeled benchmark was not supplied. The brief’s ≥85% critical-overlap recall / false-alert target is therefore not claimed as measured. Run that benchmark before making accuracy claims.
- Samples are taken at each caption cue midpoint. Rapid movement inside a long cue can require human playback or splitting the cue.
- The first release is unsigned. macOS Gatekeeper and Windows SmartScreen can show warnings. The landing page and README disclose this.
- No updater is included, so no updater manifest is shipped.

## Needs operator action

1. Register the paid product slug `caption-placement-check` with the Sociobot billing factory, price it at USD $19 one-time, and set its return URL to `https://caption-placement-check.sociobot.in/check/`. The code intentionally contains no hardcoded billing product ID.
2. Deploy `dist/site/` to the product hostname. The page’s release-manifest fetch is enabled only at `caption-placement-check.sociobot.in`, avoiding noisy cross-origin failures in local development.
3. For signed releases, configure Apple notarization and Windows Authenticode. Certificate material is not present and must never be committed. Expected secret names for that future workflow wiring are `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and `WINDOWS_CERT_PASSWORD`. The current workflow deliberately builds unsigned and consumes none of them.
4. Run the labeled 30-video accuracy set, including non-Latin on-screen scripts and sign-language layouts; tune `denseRegions` thresholds from measured results.

## Next sensible improvements

- Add bundled face/text models only if they remain local, materially outperform native/heuristic detection, and stay within an acceptable desktop package budget.
- Add start/mid/end samples for long cues and merge neighboring findings into intervals.
- Add a reviewer-authored per-video preset chooser and editable finding notes.
