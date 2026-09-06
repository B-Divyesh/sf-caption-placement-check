# Protected-region repair verification — 7

**Verdict: PASS for the static product repair.**

The implementation candidate is
`679c2566026bbeb1c5a0ed506f7e2866fe265317`. It repairs F-6-1 from
`.factory/verification-6.md`: after a keyboard-added protected region, a
pointer drag can now add its own second region reliably.

## Cause and repair

The checker reset the overlay canvas dimensions for every redraw. A keyboard
mark triggers a redraw before the following pointer gesture, so that gesture
could lose its reliable capture/coordinate path in repeated browser runs.

The repair resizes the overlay only when its rendered stage changes, clears it
without resetting dimensions, uses client coordinates normalized against the
current canvas rectangle, tracks one active pointer, cleans up cancelled
gestures, and completes an off-canvas release through a window fallback.

The regression remains outcome-based: the public `@claim:manual-regions` flow
adds a region with Enter, draws another region with a pointer, exports the
project, and requires exactly two protected regions in the result.

## Clean verification

After `npm ci`, every exact claim command listed in `.factory/claims.json`
passed: **22/22 passed, 0 failed, 0 untested**. The repaired manual-region
claim also passed ten focused repetitions.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:e2e -- --repeat-each=2` | PASS — 48/48 |
| `npm run test:benchmark` | PASS |
| `npm run check` | PASS after documented Tauri Linux prerequisites |
| `npm run build` | PASS — `dist/site` and `dist/app` produced |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |
| `sh -n public/install.sh` | PASS |

## Live verification

Static deployment of the implementation completed successfully. The live
checker served the new app bundle and passed these fresh-browser checks:

- At 1440 × 900 and 390 × 844, the first screen said **Check captions before
  they hide the video**, named educators and creators, and showed **Try it
  with sample data** before scrolling.
- The one-click demo displayed its persistent “Demo — sample data, nothing is
  saved” label, two alerts, two recommendations, and reset to the same sample.
- A live `/check/` scan with the shipped video and SRT accepted a keyboard
  protected region followed by a pointer drag. Its exported JSON had exactly
  two protected regions.
- The demo reloaded offline after its first visit with its title, banner, and
  two alerts. No browser console errors occurred.
- `verify-url.sh` passed on the root. The Playwright Axe scan found zero
  serious or critical issues on root, demo, checker, Privacy, Terms, and 404,
  at both desktop and phone widths. The standalone Axe CLI was attempted but
  cannot launch in this worker because it lacks a system Chrome binary.
- `/`, `/demo/`, `/check/`, `/privacy/`, `/terms/`, `/robots.txt`, and
  `/sitemap.xml` return 200. The styled unknown route returns the expected
  404.

## Earlier findings

The full earlier verification and review history was read before the repair.
F-6-1 is resolved. The 29 reviewed items recorded in
`.factory/review-1.md` remain resolved per `.factory/polish-1.md` and
`.factory/verification-6.md`; no regression was observed in the required
full suites, demo isolation, offline demo, metadata, privacy, route, or Axe
checks.

## Desktop release

Tag `v0.1.5` points at the implementation commit. Its required macOS, Windows,
Linux, and manifest workflow completed successfully at
<https://github.com/B-Divyesh/sf-caption-placement-check/actions/runs/34014525333>.
The release contains macOS arm64/x64, Windows MSI/EXE, and Linux AppImage/DEB/
RPM assets plus `SHA256SUMS` and `latest.json`.

The Linux AMD64 DEB checksum
`8df2288e6cf67b8364033946ac04affda2f5a107bfd103f8fbdf63fce78cce46` matched
both published manifests. Its isolated extracted payload launched under Xvfb
and stayed running through an eight-second consumer smoke interval. The exact
desktop-download and unsigned-build claims were then rerun against v0.1.5 and
passed.
