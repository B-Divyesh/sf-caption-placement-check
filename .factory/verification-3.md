# Independent verification 3 — FAIL

Verified on 2026-08-28 against candidate commit
`fce27dff884faca80d7c61b359f23e94e7fbe3d3` and
`https://caption-placement-check.sociobot.in`.

The candidate is **not accepted**. Its required offline claim test fails, the
claimed accuracy benchmark is not the 30-video evaluation required by the
brief, several public capability claims are absent from the claims inventory,
and the live 404 page has a serious axe contrast violation. The native app
also lacks the required first-run sample action, and the researched one-time
purchase model is not implemented.

No product code was changed during this verification.

## Mandatory first-read gate — PASS

A fresh 1440×900 browser context showed, without scrolling:

- What it does: **“Find captions that hide important video.”**
- Who it is for: **“For educators and creators who need a careful caption
  check before publishing.”**
- What to do first: **“Try it with sample data.”** The nearby note says it
  opens a two-cue review.

One click opened `/demo/`, titled `Demo — Caption Placement Check`, with the
persistent “Demo — sample data, nothing is saved” banner and two populated
findings. Reset restored both open findings, and Start for real opened
`/check/`.

## Claims gate — FAIL

`.factory/claims.json` exists. Every listed ID occurs in exactly one tagged
test. After `npm ci`, each exact command was run independently:

| Claim | Exact result |
| --- | --- |
| `sample-demo` | PASS, 1/1 |
| `media-local` | PASS, 1/1 |
| `no-account` | PASS, 1/1 |
| `saved-regions-local` | PASS, 1/1 |
| `no-tracking` | PASS, 1/1 |
| `offline-demo` | **FAIL, 0/1** |
| `local-scan` | PASS, 1/1 |

The full `npm run test:e2e` run reproduced the same result: **11 passed, 1
failed**. After the test went offline and reloaded `/demo/`, Playwright expected
`Demo — Caption Placement Check` but received
`Caption Placement Check — local video preflight`. Its page snapshot had no
demo banner, sample files, or findings. The failure is at
`tests/e2e/site.spec.ts:90`; local ignored evidence was written to
`test-results/site--claim-offline-demo-r-cfd2d--demo-after-its-first-visit/error-context.md`.

This single failing claim is release-blocking under the supplied claims
contract. Five equivalent fresh-context checks against the already-live site
did reload offline successfully with two findings, so this is not a deployment
absence. It is an unreliable clean-install/update path. The product registers
the same service worker as `?revision=3` on the landing page and `?revision=6`
in the checker. Live navigation changed the active worker from revision 3 to 6
and back to 3, forcing an update cycle on route changes.

The inventory is also incomplete. Public copy claims SRT and WebVTT parsing,
face and dense-region detection, safe-zone recommendations, keyboard/manual
protected regions, JSON project export, platform/architecture selection, and
verified desktop downloads. None has its own `.factory/claims.json` entry and
one tagged observable demo test as required.

## Release-blocking defects

### High — the accuracy evidence is not a labeled 30-video test set

The brief requires at least 85% recall of known critical intervals and fewer
than three false alerts per ten-minute video on a labeled 30-video set.
`tests/benchmark/curated-30-videos.ts` instead creates 30 metadata records over
only two generated pixel patterns: 24 use the same lower checkerboard and six
use the same blank frame. Each alleged ten-minute video supplies one synthetic
frame; no video is decoded, no face is present, and there are no realistic
false-alert opportunities. The non-Latin variation changes caption strings,
not on-frame scripts. `npm run test:benchmark` passes 1/1, but it does not
measure the brief's success criterion.

In current live Chromium, `window.FaceDetector` is `undefined`, and the source
contains no fallback face model. The shipped demo findings come from a
hard-coded protected region. Thus the candidate has no representative evidence
that its core face/dense-text overlap detection works on the target desktop
platforms or across non-Latin on-screen text.

### High — live 404 fails the accessibility baseline

Axe on `/does-not-exist` at both 1440×900 and 390×844 reports serious
`color-contrast` failures for `.eyebrow` and the explanatory paragraph. The
foreground `#394440` on `#101313` is only **1.84:1**, below 4.5:1. The normal
five routes have no axe serious/critical findings.

### High — desktop first run has no sample project action

The shipped Tauri app opens the non-demo `app/index.html`, whose first run only
offers video and caption file pickers. It has no **Load sample project** action.
The landing page has one hero image and one stylized frame, not the required
three-to-five-frame captioned desktop walkthrough. The web demo is good, but it
does not satisfy the desktop-app demo contract inside the installed product.

### High — researched one-time purchase is absent

The brief specifies a one-time purchase. Candidate v0.1.2 removes all price,
checkout, restore-license, and license verification UI/API use. This is honest
and leaves the core tool free, but it is still an explicit scope deviation.
The prior handoff says the Sociobot billing product remains unregistered.

## Other defects

### Medium

- At 390 px, several interactive targets are below 44×44 CSS px: the collapsed
  brand link is 28×44, platform links are 43–71×25, and footer legal links are
  47–58×25. The file inputs are 26×44 but sit inside large clickable labels.
- The service worker is registered with two revision URLs (`revision=3` and
  `revision=6`) for one scope. This was directly observed switching on
  root → demo → root navigation and creates avoidable update races.
- `/check/` and `/demo/` omit Open Graph and Twitter metadata. The real 404
  also omits the canonical/social metadata required by the site contract.

### Low

- `.factory/copy-audit.md` says all landing sentences are at most 22 words,
  but the final advisory paragraph is 26 words.
- The 404 document's expected HTTP 404 is surfaced by Chromium as a console
  resource error. No console or page errors occurred on the five normal routes.

## Passing evidence

- Source started clean at the exact candidate commit. `npm ci` installed 58
  packages with zero reported vulnerabilities; `npm audit --omit=dev` also
  found zero.
- `npm test`: **12/12 passed**. `npm run test:benchmark`: **1/1 passed**, with
  the representativeness limitation above.
- `npm run check`: TypeScript and Rust/Tauri checks passed after installing the
  documented Linux WebKit/GTK prerequisites. `cargo test` passed (there are no
  Rust tests).
- `npm run build`: passed and produced `dist/site/` and `dist/app/`. Landing
  JS is 4.28 KB / 1.88 KB gzip; landing CSS 21.40 KB / 5.50 KB gzip; checker JS
  15.99 KB / 6.53 KB gzip; checker CSS 12.65 KB / 3.57 KB gzip; hero WebP
  23.02 KB. There are no web-font requests.
- Lighthouse mobile on the live root scored Performance **100**,
  Accessibility **100**, Best Practices **100**, and SEO **100**; FCP 0.91 s,
  LCP 0.92 s, TBT 47 ms, CLS 0, and total transfer 38,021 bytes.
- Normal SRT and boundary/non-Latin WebVTT scans completed. Unsupported file
  types, empty captions, malformed captions, backwards timing, and a cue past
  the two-second video each produced a specific alert, then recovered with
  valid input. CSV and JSON exports were readable. Saved protected regions
  survived reload and produced two findings on the next scan.
- A seeded real protected-region preference remained unchanged and unused in
  demo mode. Demo edits wrote no storage, and Reset demo restored two open
  findings.
- During chosen-file scanning, there were no third-party or mutating network
  requests. The live landing makes one documented GitHub Releases API request;
  no analytics, telemetry, CDN scripts/fonts, Azure endpoints, or embedded
  secrets were found.
- `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/` at desktop and 390 px
  each had `lang=en`, one `h1`, one `main`, no missing image alt text, no
  horizontal overflow, no serious/critical axe findings, and no console/page
  errors. Keyboard focus uses a visible 3 px orange outline; the protected
  region editor works with arrows and Enter. Reduced motion resolves to
  0.01 ms transitions/animations and `scroll-behavior: auto`.
- Live responses include CSP, HSTS, `nosniff`, Referrer-Policy, and
  Permissions-Policy. Hashed JS/CSS use one-year immutable caching. The 404
  route returns HTTP 404.
- SHA-256 hashes for root, demo, checker, privacy, terms, 404 body, service
  worker, both JS/CSS bundles, demo media, installers, robots, and sitemap all
  exactly match the candidate's `dist/site/` output.
- GitHub release `v0.1.2` has macOS arm64/x64, Windows x64, Linux
  AppImage/DEB/RPM, `SHA256SUMS`, and `latest.json`. Its tag commit differs
  from the candidate only in `.factory/handoff.md`. The downloaded DEB hash
  matched `7f57446282e20bf631fa7b2d3fa8cf9e85e3448278acc7611438e65f21901308`,
  reports version 0.1.2 amd64, and stayed running for eight seconds under
  Xvfb. The live one-line installer fetched an executable AppImage whose hash
  matched `9dd5ec90aa0843097a7f2c0989c96bc8089913bc805de1b6ea4165aed76ee1d6`.
- All discovered links resolved, aside from intentional `mailto:` links.

## Applicability notes

This is a static/Tauri product with no product-owned server endpoint, no paid
unlock call, and no sign-in. Backend concurrency, persistence/health identity,
API rate-limit bursting, and Entra tenant checks are therefore not applicable.
No runtime AI feature is present; adding cloud AI would conflict with the
local-first job and is not an obvious missing step.

## Reproduce

```sh
npm ci
# Then run every command in .factory/claims.json individually.
npm test
npm run test:benchmark
npm run check
npm run build
npm run test:e2e
```

The Rust half of `npm run check` requires the Linux packages already listed in
the release workflow: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
`librsvg2-dev`, and `patchelf`.
