# Independent verification 2 — FAIL

Verified 2026-08-28 from a clean checkout at candidate commit
`7b3cd391f8d0c702de61a9549afaaca557bf85b8` against
`https://caption-placement-check.sociobot.in`.

## Verdict

**FAIL.** This is not a deployment-only failure: the published site and its
browser checker exactly match this candidate and the repaired functional paths
are working. The candidate still cannot meet the researched-brief success
criterion, its public claims are not fully covered by `.factory/claims.json`,
and it presents a paid Studio tier that cannot be purchased. Those are
release-blocking acceptance-contract failures.

## First-read gate — PASS

A cold 1440×900 visit plainly says what it does: “Find captions that hide
important video.” It names the audience: “educators and creators,” and the
primary one-click action is **Try it with sample data**, with the adjacent
explanation “Opens a short sample review with two caption cues.” The action
opens `/demo/`, immediately produces two protected-region findings and
recommendations, and exposes CSV export.

## Required claims gate — PASS, with inventory/test gaps below

`.factory/claims.json` exists and each exact command was run after `npm ci`:

| Claim | Exact test | Result |
| --- | --- | --- |
| `sample-demo` | `npm run test:e2e -- --grep @claim:sample-demo` | PASS (1/1) |
| `media-local` | `npm run test:e2e -- --grep @claim:media-local` | PASS (1/1) |
| `offline-demo` | `npm run test:e2e -- --grep @claim:offline-demo` | PASS (1/1) |
| `local-scan` | `npm run test:e2e -- --grep @claim:local-scan` | PASS (1/1) |

I also performed the missing observable offline-reload operation against the
live demo: ten fresh contexts cleared registrations/caches, visited `/demo/`,
waited for the cache, went offline, **reloaded**, and restored both findings.
That passed **10/10** without console/page errors.

However, the declared `@claim:offline-demo` test itself does not call
`page.reload()` after `context.setOffline(true)`; it only inspects the already
loaded page. It does not prove its stated “reloads … after its first visit”
outcome. More importantly, the following public claims have no individually
tagged observable claim test: “Video never leaves the device,” “Nothing is
uploaded,” “Files stay in local memory,” “No account required,” “Free core
check,” and the privacy-policy promise that the service does not receive,
store, or inspect media. `media-local` covers only the shipped demo sample.
The claims contract requires these claims to be listed and tested (or removed),
so this remains a release blocker despite the four listed commands passing.

## Release-blocking findings

### High — brief success measure is not verifiable

The brief requires a labeled 30-video test set demonstrating at least 85% of
known critical caption-overlap intervals with fewer than three false alerts
per ten-minute video, including non-Latin-script evaluation. No labeled media
set, expected findings, benchmark runner, recall calculation, or false-alert
calculation exists. Source search found only parser/helper tests and the
runtime `FaceDetector`/dense-region heuristic. The two-cue sample is useful
for a demo, but cannot substitute for the required evaluation.

### High — public claims lack required sandbox proof

See the claims-gate evidence above. The live page and privacy policy make
strong local-processing/no-upload statements for real user media, while the
only relevant claim test observes the shipped sample flow. The inventory must
cover every visitor-reliant claim with a demo-entry test that exercises the
observable promise.

### High — advertised one-time Studio tier is unavailable

The landing/checker show “Optional one-time unlock” and `$19 once`, but replace
checkout with “Studio purchase is being set up.” The terms and README confirm
that hosted checkout is not published. This does not satisfy the brief's
one-time monetization or the paid-unlock contract for a displayed paid tier.
The handoff identifies the needed external action: register the Sociobot
product and publish the Sociobot hosted checkout; no payment-provider link is
present today.

## Other findings

### Medium — moderate axe landmark violations on the populated demo

At both 1440×900 and 390×844, axe reports `landmark-complementary-is-top-level`
and `region` at moderate severity on `/demo/`. There are no serious or critical
axe findings, but the review finding panel is an `aside` nested in `main` and
the populated demo does not meet the requested clean landmark baseline. Use a
non-landmark container for the in-main cue panel, or restructure/label it so
the resulting landmark tree is valid.

### Low — release/package version mismatch

The published tag and page identify release `v0.1.1`, while the downloaded
DEB and Tauri metadata report package version `0.1.0`. The executable is the
same application code (the tag commit `60a5c24` is an ancestor of this
candidate and the candidate differs only by handoff documentation), but the
version mismatch is confusing for users and support.

## Passing evidence

- `npm ci` completed with 0 audit vulnerabilities.
- `npm test`: **11/11 passed**.
- `npm run test:e2e`: **8/8 passed**.
- `npm run build`: passed and produced `dist/site/` and `dist/app/`. Initial
  static assets: landing JS 4.28 KB / CSS 21.40 KB; checker JS 17.81 KB / CSS
  12.64 KB uncompressed (all below applicable budgets).
- `npm run check` initially exposed the expected missing clean-container Tauri
  GLib development package. After installing the release workflow's documented
  Linux dependencies (`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
  `librsvg2-dev`, `patchelf`), TypeScript and `cargo check` passed.
- `sh -n public/install.sh` and `npm audit --omit=dev` passed.
- Representative end-to-end checks on the live checker passed: valid WebM/SRT
  scan; unsupported caption extension, malformed SRT, backwards cue, and cue
  beyond video duration each showed a specific alert; each recovered with a
  valid sample and completed its two-cue scan. Demo isolation was retested
  with a seeded real license/verdict: Studio stayed locked and all traffic was
  same-origin (apart from a local blob URL).
- Live browser QA on `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/` at
  1440×900 and 390×844 found no console/page/failed-request errors, no
  horizontal overflow, one `h1`, `lang=en`, `main`, visible 3px orange keyboard
  focus, and no serious/critical axe violations. Reduced motion resolves
  transitions/animations to 0.01 ms.
- Lighthouse mobile retry: Performance **100**, Accessibility **100**, Best
  Practices **100**, SEO **100**; FCP 1.3 s, LCP 1.4 s, TBT 0 ms, CLS 0.
- Live root/check/demo/legal HTML, service worker, hashed JS/CSS, and shipped
  demo WebM/SRT SHA-256 hashes exactly matched this candidate's `dist/site/`.
  `/does-not-exist` returns 404. Hashed assets are `max-age=31536000,
  immutable`; CSP, HSTS, nosniff, Referrer-Policy, and Permissions-Policy are
  present.
- A 50-request concurrent burst to the live public verify endpoint yielded 30
  HTTP 200 and 20 HTTP 429 responses; every 429 had `Retry-After: 4`. The
  observed burst allowance is therefore 30 requests. With the production
  Origin header the endpoint returns the site's exact CORS origin and
  `Cache-Control: no-store`.
- Release `v0.1.1` contains all expected desktop assets. Downloaded
  `Caption.Placement.Check_0.1.0_amd64.deb` matched `latest.json` SHA-256
  `a9ba5a924c3f4d06f782474303766d617eff4644bc93e9e1393937c31264d1fd`.
  It reports package `caption-placement-check` 0.1.0 amd64 and remained
  running for six seconds under Xvfb after extraction.

## How to reproduce

```sh
npm ci
npm run test:e2e -- --grep @claim:sample-demo
npm run test:e2e -- --grep @claim:media-local
npm run test:e2e -- --grep @claim:offline-demo
npm run test:e2e -- --grep @claim:local-scan
npm test
npm run test:e2e
npm run check                 # needs the documented Tauri Linux packages
npm run build
```

No product source code was modified during this verification.
