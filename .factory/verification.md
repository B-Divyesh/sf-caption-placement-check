# Independent verification — FAIL

Verified on 2026-08-28 against candidate commit
`ad24bb2ca7f1262d60f27fc615137f281f263985` and
`https://caption-placement-check.sociobot.in`.

The candidate is **not accepted**. The required offline claim is flaky and
failed in the repository suite, the demo reads real-user license state, the
paid checkout is unavailable, and mobile legal pages have serious axe
violations. The published desktop binaries also come from an older commit.

No product code was changed during verification.

## First-read gate

**PASS.** A cold 1440×900 visit says:

- What it does: “Find captions that hide important video.”
- Who it is for: educators and creators checking before publishing.
- What to click: “Try it with sample data,” followed by a note that it opens a
  two-cue sample review.

The sample is one click away. However, its result is not an effective product
demonstration: it reports `2 cues sampled · 0 cues need a closer look`, renders
no review items or recommendation, and exports a CSV containing only its
header.

## Claims gate

`.factory/claims.json` exists and contains one tagged test per listed claim.
After `npm ci`, each exact command passed once in isolation:

| Claim | Initial isolated result | Independent result |
| --- | --- | --- |
| `sample-demo` | PASS, 1/1 | PASS in a fresh empty context |
| `media-local` | PASS, 1/1 | FAIL for a pre-existing real-user license state; details below |
| `offline-demo` | PASS, 1/1 | **FAIL** in the full suite and 7/10 repeated runs |
| `local-scan` | PASS, 1/1 | Functional scan/download passes, but the claim test checks only the filename |

The full `npm run test:e2e` run failed 1 of 8 tests. The failing claim emitted
`net::ERR_FAILED` for `/demo/assets/index-DtkevJYc.js`. A focused
`--repeat-each=10` run failed 7 times, usually losing both the demo JavaScript
and CSS during offline reload. This is release-blocking under the claims
contract even though five separate checks against the already-live deployment
happened to reload offline successfully.

The claims inventory is also incomplete or too narrow for public copy:

- “Video never leaves the device,” “Nothing is uploaded,” and “media is never
  uploaded” are stronger than the demo-only, same-origin request assertion.
- “No account required,” “Free core check,” face detection, the
  script-agnostic density heuristic, and reusable Studio features are not
  listed as claims.
- `local-scan` opens `/check/`, not the required demo entry point, and asserts
  only the download filename. It does not assert the CSV header or row count.
- The README claims that only license/verdict/preset data is stored, while the
  landing page also writes `cpc:release-metadata:v1` to local storage.

## Release-blocking defects

### High — offline claim fails nondeterministically

The repository's own `@claim:offline-demo` failed in the normal full suite and
7/10 repeated runs after a clean install. Cached-asset checks passed before the
reload, but the reload still requested one or both hashed assets from the
network. The service worker uses a cache-first shell with a fixed
`caption-placement-check-v3` cache and has no reliable update/reload handshake.

### High — demo sandbox reads real-user data

With `sb_license:caption-placement-check` and a fresh valid cached verdict
seeded before entering `/demo/`, the demo loaded with `studio-unlocked`, showed
“Studio is active on this device,” and enabled the Studio controls. With a
stale verdict, the demo sent the real token to
`https://api.sociobot.in/.../verify`. This contradicts `.factory/demo.md`,
which says demo mode never reads real license keys, and violates the isolated
sandbox contract.

The cause is observable in `src/app.ts`: `queryLicense` is disabled in demo
mode, but `localStorage.getItem(LICENSE_KEY)` is still evaluated afterward.

### High — advertised purchase cannot be completed

`GET https://api.sociobot.in/api/v1/products/caption-placement-check/checkout`
returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
Both the landing page and checker advertise a `$19` one-time Studio purchase.

### High — serious mobile accessibility violations

At 390×844, axe reports `link-name` (serious) on both `/privacy/` and `/terms/`.
Their home/brand link has no `aria-label`; its text is hidden by the mobile CSS
and its remaining mark is `aria-hidden`. Desktop axe runs did not expose this
responsive defect.

The manual protected-region workflow is also pointer-only. “Mark protected
region” is keyboard reachable, but the canvas has no tab stop or keyboard
operation and accepts only pointer drag events. This blocks a keyboard user
from marking an interpreter, slide, or sign that automation misses.

### High — published desktop artifacts do not represent the candidate

The current release tag `v0.1.0` resolves to
`e04c946936ad72011f6eb9cf637691db8962ce1c`, while the candidate is
`ad24bb2ca7f1262d60f27fc615137f281f263985`. There are 24 changed paths between
them, including `app/index.html`, `src/app.ts`, the installers, and the release
workflow. The website matches the candidate byte-for-byte, but the downloadable
desktop app was not built from it.

### High — detected-platform downloads can select the wrong package

- An Intel Mac user agent resolves the main download to the `aarch64.dmg`.
- A generic Linux user agent resolves the main download to the RPM, which is
  not the appropriate package for Debian/Ubuntu users.
- The shell installer maps macOS `x86_64` to the first mac asset, also the ARM
  DMG. Its Linux logic always selects the amd64 AppImage, including on aarch64.

The release contains valid alternatives, but the one-step selection is not
architecture/distro safe.

### High — brief accuracy target is not verifiable

No labeled 30-video set or automated recall/false-alert benchmark is present,
so the brief's ≥85% critical-overlap recall and fewer than three false alerts
per 10-minute video cannot be established. Existing unit tests cover caption
text parsing, not the frame-density detector or a real face detector. A
representative generated frame with English and Arabic on-screen text did
produce one correct dense-overlap alert and “Move ... to top center,” but that
single case cannot substitute for the acceptance benchmark.

## Other defects

### Medium

- `/does-not-exist` returns the landing page with HTTP 200. The authored
  `404.html` is not served, so the required real 404 route is broken.
- After drawing a protected region over both sample captions, the list and CSV
  correctly contain two findings, but the summary still says “0 cues need a
  closer look.”
- All tested static responses, including hashed JS/CSS and the hero image, use
  `Cache-Control: public, must-revalidate, max-age=30`; hashed assets are not
  long-lived or immutable.
- `/demo/` uses the checker title instead of `Demo — Caption Placement Check`.
  Legal routes omit canonical/social metadata and the standard footer. The
  Open Graph image is 1200×800 rather than 1200×630, no `twitter:image` is
  supplied, and there is no apple-touch icon.

### Low

- At 390 px, the macOS/Windows/Linux links are approximately 25 px high, below
  the specified 44 px touch target.
- The app footer does not include the Param Factory credit or a version/build
  identifier.

## Passing evidence

- Clean source state began at the exact candidate commit; `npm ci` passed with
  0 reported vulnerabilities.
- `npm test`: **11/11 passed**.
- `npm run check`: TypeScript and Rust/Tauri checks passed after installing the
  documented Linux WebKit/GTK prerequisites.
- `npm run build`: passed and produced `dist/site/` plus `dist/app/`.
- Build sizes: landing JS 3.30 KB (1.54 KB gzip), landing CSS 21.04 KB (5.43 KB
  gzip), checker JS 16.64 KB (6.80 KB gzip), checker CSS 12.49 KB (3.51 KB
  gzip), hero WebP 23.02 KB. No web fonts are fetched.
- Lighthouse mobile on the live root: Performance 97, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.052 s, LCP 2.065 s, TBT 162 ms, CLS 0.
- Fresh live loads of `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/` had
  no console errors, page errors, failed requests, or HTTP ≥400 subresources.
- Desktop axe found no serious/critical violations on those five routes.
- Root/checker keyboard focus is visible with a 3 px orange outline. Empty,
  malformed, backwards, and out-of-duration caption files produce specific
  `role=alert` messages and recover after valid input.
- The checker correctly avoided a blank frame and flagged a representative
  English/Arabic bottom-text collision, recommending top center.
- Drawing a protected region over the shipped sample created two findings and
  exported a CSV with two properly quoted rows.
- Fresh demo traffic was same-origin and fresh demo local/session storage was
  empty. There were no analytics, CDN scripts, or font requests.
- Live security headers include HSTS, CSP with `frame-ancestors 'none'`,
  `nosniff`, Referrer-Policy, and Permissions-Policy.
- The billing verify endpoint rate limit passed: a 120-request burst with
  concurrency 20 returned 30 HTTP 200 responses followed by 90 HTTP 429
  responses; all 90 included `Retry-After` (observed 0–4 seconds).
- Live root, app JS/CSS, demo/check HTML, privacy/terms HTML, service worker,
  and hero bytes exactly match the candidate's production build.
- GitHub release `latest.json` is valid and lists macOS arm64/x64, Windows,
  AppImage, DEB, and RPM assets. The downloaded DEB SHA-256
  `1ab5d6dfcc293ed735d38b14550cb27521711873e6c3942992cdcbbfecdc2825`
  matched both `latest.json` and `SHA256SUMS`.
- The shell installer completed in an isolated temporary install directory,
  verified the 75.5 MB AppImage, and the extracted AppImage remained running
  under Xvfb until the eight-second test timeout.
- `sh -n public/install.sh` and `npm audit --omit=dev` passed.
- Reduced-motion CSS collapses transitions/animations to 0.01 ms. Desktop and
  390 px layouts had no horizontal overflow at normal zoom.

## Commands used

```sh
npm ci
npm run test:e2e -- --grep @claim:<id>   # each listed claim
npm test
npm run check
npm run build
npm run test:e2e
npm run test:e2e -- --grep @claim:offline-demo --repeat-each=10
sh -n public/install.sh
npm audit --omit=dev
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh <url> <evidence-dir>
npx lighthouse@12.8.2 <url> ...
```

Repair the high-severity items, publish desktop artifacts from the repaired
candidate, and rerun all claims from clean storage before reconsidering release.
