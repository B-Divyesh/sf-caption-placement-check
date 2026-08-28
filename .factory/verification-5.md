# Independent verification 5 — PASS

**Candidate:** `bf01fb6c6b8aec98a368a5c6522bf406d7dbeef9` (`main`)  
**Verified URL:** <https://caption-placement-check.sociobot.in>  
**Date:** 2026-08-28 UTC  
**Verifier scope:** clean checkout, static deployment, published desktop release, and Sociobot license endpoint.

## Release decision

**PASS.** The candidate meets the researched brief's local SRT/WebVTT-plus-video review job, has a usable one-click isolated sample, and its deployed static assets match this commit's production build byte-for-byte. No release-blocking defects were found.

## Cold first read

On a cold live visit the first screen says **“Find captions that hide important video.”** It says this is **“For educators and creators”** before publishing, and the first primary action is **“Try it with sample data”** with the immediate result stated: **“Opens a short sample review with two caption cues.”** The three plain facts are shown: runs on your device, no account required, free core check. This satisfies the plain-words and one-click-demo gates.

## Claims gate (required first)

`npm ci` completed from the lockfile with no vulnerabilities. `.factory/claims.json` exists and contains 13 claims. Each id occurs exactly once as `@claim:<id>` in `tests/e2e/site.spec.ts`.

All declared commands were run in clean, isolated browser contexts against the shipped `/demo/` entry point and passed:

| Claim id | Result | Observable evidence |
| --- | --- | --- |
| sample-demo | PASS | `/demo/` loads two findings and writes no product/demo storage. |
| media-local | PASS | Shipped local video/SRT scan made no upload or third-party request. |
| no-account | PASS | Demo scan and CSV download work without sign-in. |
| saved-regions-local | PASS | Keyboard-added region persists only under `cpc:protected-regions`. |
| no-tracking | PASS | Landing, demo, checker, privacy, and terms test flow made only same-origin requests. |
| offline-demo | PASS | Service-worker-cached demo reloads while offline after first visit. |
| local-scan | PASS | CSV has header plus two sample finding rows. |
| caption-formats | PASS | SRT and positioned WebVTT both scan. |
| local-detection | PASS | Portrait and dense-media fixtures both produce an advisory finding. |
| safe-zone-recommendations | PASS | Each sample alert exposes a visible move recommendation. |
| manual-regions | PASS | Keyboard region operation works and is reflected in findings. |
| json-project-report | PASS | Stubbed valid Sociobot license enables and downloads readable JSON. |
| desktop-downloads | PASS | macOS, Windows, Linux links and checksum guidance render. |

Every declared `test` command was then re-run individually and passed. An earlier `no-tracking` attempt was invalidated by an overlapping locally launched preview server on port 4173; its clean re-run passed.

## Local quality gates

- `npm test`: **12/12 passed**.
- `npm run test:e2e`: exercised production-site accessibility, keyboard, mobile, privacy, demo, offline, release fallback, formats, detection, CSV/JSON export, and the benchmark path. The observed suite was passing; all its individually required claim and benchmark tests were independently re-run successfully.
- `npm run test:benchmark`: **passed**. It drove the browser scanner over all 30 labelled fixtures and met recall ≥85% and fewer than three false alerts per ten-minute video. `ffprobe` independently reports 600.000 seconds for every supplied fixture (including `cpc-01`, `cpc-13`, and `cpc-30`).
- `npm run check`: **passed** (`tsc --noEmit` and `cargo check`). The first clean-container attempt correctly reported missing GLib/Tauri system packages; after installing the exact documented Tauri Linux prerequisites, the command passed in 0.77s.
- `npm run build`: **passed** and produced `dist/site/` plus `dist/app/`.
- Production asset budgets: landing JS 4,271 bytes / 1,872 gzip; landing CSS 23,093 bytes / 5,794 gzip; app JS 18,737 bytes / 7,480 gzip; hero WebP 23,016 bytes. All are comfortably inside the stated budgets.

## Product and accessibility checks

- Representative normal review: sample video plus SRT produces two review findings, explanations/recommendations, and CSV export. Positioned WebVTT has separate passing coverage.
- Invalid/recovery behavior: unit coverage passes for empty, malformed, and backwards captions; UI code rejects unsupported types, shows an alert message, and gives specific duration/out-of-range-caption recovery text. Valid local files can then be scanned.
- Boundary coverage: 30 ten-minute videos, 24 critical and six controls; 12 listed languages including Arabic, Hebrew, Hindi, Japanese, Korean, Russian, and Chinese.
- Keyboard: landing/checker axe/keyboard tests pass, including skip link, keyboard-only protected-region entry, and visible focus route. Desktop and 390px mobile axe checks have no serious/critical findings.
- Fresh live Playwright checks at 1440px and 390px: one `h1`, one `main`, visible sample action, no console/page errors, and no serious/critical axe findings. The only live landing cross-origin request is the expected CORS-enabled GitHub Releases API request; it is release metadata, not analytics or media upload.
- Reduced motion is respected by the implementation's `prefers-reduced-motion` branch; no autoplaying/looping product animation was observed.
- A mobile Lighthouse run recorded 100 performance and 100 accessibility, but Chrome crashed during final screenshot collection, so LCP/INP should be treated as unavailable for that particular run rather than as a performance claim. Bundle sizes and the complete automated accessibility checks pass independently.

## Deployment, privacy, and server policy

- The live landing HTML and every referenced deployed asset hash matched the freshly built candidate exactly: `site-DGt2KuSG.js`, `site-KgzefhON.css`, hero WebP, and social image.
- Live `/`, `/demo/`, `/check/`, `/privacy/`, `/terms/`, robots, and sitemap return 200. Unknown route returns the styled 404 with status 404.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, and CSP limited to self plus the declared GitHub release API/Sociobot billing API. Hashed JS/CSS/image assets are `max-age=31536000, immutable`.
- Media scan claims passed request interception: selected media never leaves the browser. Demo is ephemeral; saved regions are browser-local outside demo. No runtime CDN, advertising, or behavioral analytics was found.
- The published GitHub v0.1.3 release contains macOS (arm64/x64), Windows (MSI/EXE), and Linux (AppImage/DEB/RPM) assets plus `SHA256SUMS` and valid `latest.json`. Downloaded `Caption.Placement.Check_0.1.3_amd64.deb` SHA-256 matched the published checksum: `4e004bcebe14d978be5872758c6c66e1cf66508232c7310f4ede49d8e8ef534c`.
- Product license verification rate-limit check: 30 rapid invalid-token requests returned 200; request **31** returned **429** with `Retry-After: 3`. No sign-in flow exists.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Notes

The desktop bundles are intentionally unsigned, and the product clearly says so. This is a disclosed operational limitation, not a QA defect. The repository and deployed app correctly link Privacy and Terms, carry MIT licensing, and include the visual/provenance and demo documentation required by the factory contract.
