# Independent verification 4 — FAIL

Verified on 2026-08-28 from clean commit
`7d20f8c3c214aaa803ddcd0aab56864180272694` against
`https://caption-placement-check.sociobot.in`.

## Decision

**FAIL.** The deployed static site is the tested candidate, but this desktop
release cannot be accepted: the required offline-demo claim is unreliable in
the full clean regression run, and every desktop download points to a bundle
made from an older commit than the candidate.

No product code was changed during verification. This report and the handoff
are the only repository changes.

## Mandatory cold first read — PASS

A new 1440x900 browser context loaded the live landing page with no prior
storage. Its first screen says:

- What it does: **“Find captions that hide important video.”**
- Who it is for: **“For educators and creators who need a careful caption
  check before publishing.”**
- What to do first: **“Try it with sample data.”** The adjacent sentence says
  it opens a short two-cue review.

The action opens `/demo/` in one click. It displayed the persistent **“Demo —
sample data, nothing is saved”** banner, two findings, and a CSV export.

## Release-blocking findings

### High — offline demo claim fails in the combined clean claim regression

`.factory/claims.json` exists and declares 13 claims, each with one matching
`@claim:` test. After `npm ci`, I ran every listed command individually from
the demo entry point. I also ran the complete claims selection:

```sh
npm run test:e2e -- --grep @claim:
```

It failed at `tests/e2e/site.spec.ts:72` on
`@claim:offline-demo`: **5 passed, 1 failed** before the runner continued.
`test-results/.last-run.json` records that one failed test. On offline reload
of `/demo/`, the expected demo title/banner/findings were replaced by the real
checker shell, headed **“Catch captions that cover what matters.”** The saved
snapshot is `test-results/site--claim-offline-demo-r-cfd2d--demo-after-its-first-visit/error-context.md`.

The same exact claim command can pass in isolation, so this is an unreliable
service-worker/cache lifecycle rather than a valid fix. A claimed offline demo
must pass every clean build; this failure is release-blocking under the claims
contract. Five independent live cold contexts and one detailed live retry did
reload the demo successfully with its banner and two findings, so the static
deployment has the candidate bytes but does not remove the local regression.

### High — downloadable desktop artifacts are not built from this candidate

The landing page’s macOS, Windows, and Linux links resolve to GitHub release
`v0.1.2`. GitHub’s release API reports target commit
`3d0ed628ba704874d510ec9568ae4c1300ad6a55`, while the candidate is
`7d20f8c3c214aaa803ddcd0aab56864180272694`. The post-tag repair commit
`234cdff` changes application source including `app/index.html`, `src/app.ts`,
`src/face.ts`, the service worker, and styles; these are not documentation-only
changes. Consequently the release assets advertised to desktop users cannot
contain the tested candidate or its claimed repairs.

This violates the desktop-app release contract even though the hosted static
site is current. Publish a new tagged, checksummed macOS/Windows/Linux release
from the repaired candidate, then verify an installed artifact.

## Quality evidence

- `npm ci`: passed; 58 packages installed and npm reported 0 vulnerabilities.
- `npm test`: **12/12 passed**.
- `npm run check`: **passed** after installing the repository-documented Linux
  Tauri prerequisites (`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
  `librsvg2-dev`, `patchelf`). The initial clean-container failure was only a
  missing system `glib-2.0` development package.
- `npm run build`: **passed**, producing `dist/site` and `dist/app`.
- `npm run test:benchmark`: **passed**; its browser regression decoded the
  labelled 30-file corpus and reported the brief threshold test passing.
- The separate exact offline claim invocation passed once, but the combined
  claim run above failed; the latter is the decisive repeatability result.

The production root, demo, checker, privacy, terms, 404, service worker,
landing JS/CSS, demo JS/CSS, and demo media were SHA-256 compared with this
candidate’s `dist/site` output and all matched. This overturns the prior
deployment-only concern for the static site.

## Product exercise and accessibility

- On live `/demo/`, two protected-region alerts rendered and `Export CSV`
  downloaded `caption-placement-findings.csv`.
- On live `/check/`, I supplied the shipped WebM and positioned WebVTT, scanned
  two cues, rejected an invalid `.txt` captions file with the specific SRT/VTT
  error, recovered by selecting valid captions, and added a protected region
  with keyboard arrows plus Enter.
- Routes `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/` each had one
  `h1`, one `main`, and zero axe serious/critical violations at desktop.
  The populated demo at 390x844 had no horizontal overflow and zero axe
  serious/critical violations. `/does-not-exist` returned 404 and had no axe
  serious/critical result.
- Keyboard focus is a visible 3px projector-orange outline. Reduced-motion
  styles reduce transition and animation durations to 0.01ms. All measured
  visible mobile interactive controls met 44px minimum dimensions.
- No console/page errors occurred on normal routes. The intentionally 404
  navigation produces the browser’s expected failed-resource console message.

## Privacy, network, and delivery

- A chosen-file scan made only same-origin requests. No analytics, CDN font,
  Azure, or media-upload request was observed. The landing release picker may
  contact `api.github.com`; its CSP explicitly permits that API and
  `api.sociobot.in` for optional license verification.
- Responses have HSTS, CSP, `nosniff`, strict-origin-when-cross-origin
  Referrer-Policy, and a restrictive Permissions-Policy. Hashed JS is served
  `public, max-age=31536000, immutable`.
- A burst of 80 invalid-license `GET`
  requests to `https://api.sociobot.in/api/v1/products/caption-placement-check/verify`
  yielded **30 × 200** then **50 × 429**. The 429 responses included
  `Retry-After` values from 0 to 3 seconds; throttling started at about the
  31st request (parallel ordering means the precise ordinal is not stable).
- There is no sign-in flow, product-owned backend, or runtime AI feature, so
  Entra, backend persistence/concurrency, and AI-gateway checks do not apply.

## Performance

Candidate production output is within the static budgets:

| Asset | Raw | gzip |
| --- | ---: | ---: |
| Landing JS | 4,271 B | 1,849 B |
| Landing CSS | 23,093 B | 5,773 B |
| Checker JS | 19,071 B | 7,612 B |
| Checker CSS | 12,970 B | 3,602 B |
| Hero WebP | 23,016 B | — |

## Required next steps

1. Make the service-worker demo cache lifecycle deterministic and ensure the
   complete claim suite passes repeatedly from clean state.
2. Tag and publish fresh signed-or-explicitly-unsigned desktop artifacts from
   the repaired candidate; update `latest.json` and SHA-256 sums.
3. Re-run this verification against that tag and installed artifact.
