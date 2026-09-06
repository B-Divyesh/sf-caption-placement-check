# Caption Placement Check — repair 6 handoff

## Status

Repair 6 fixes the reported high-severity protected-region regression. The
deployed static checker is built from implementation commit
`679c2566026bbeb1c5a0ed506f7e2866fe265317` and serves the repaired checker
bundle `index-BKJGh-W2.js`.

The matching desktop tag is `v0.1.5`. Its GitHub Actions release workflow
completed successfully at
<https://github.com/B-Divyesh/sf-caption-placement-check/actions/runs/34014525333>.
The published release targets the implementation commit and includes checksummed
macOS arm64/x64, Windows MSI/EXE, and Linux AppImage/DEB/RPM assets.

## What changed

- Kept the overlay canvas size stable while a pointer gesture is active instead
  of resetting it during every redraw.
- Normalized drag coordinates from the canvas bounds, tracked the active
  pointer, handled cancellation, and added a window-level completion fallback.
- Strengthened `@claim:manual-regions` to require exactly two exported
  protected regions after a keyboard mark followed by a pointer drag.
- Bumped the site and Tauri package version to 0.1.5 so desktop and web builds
  identify the same repair.

## Verification

From a clean `npm ci` setup, all 22 exact commands in `.factory/claims.json`
passed. In particular, `@claim:manual-regions` passed ten consecutive focused
repetitions, then the complete repeated browser suite passed 48/48.

The following commands passed after installing the documented Tauri Linux
packages (`libglib2.0-dev`, `libwebkit2gtk-4.1-dev`,
`libappindicator3-dev`, `librsvg2-dev`, and `patchelf`):

```sh
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run check
npm run build
```

- Unit/integration: 16/16.
- Normal browser suite: 24/24.
- Repeated browser suite: 48/48.
- Benchmark: unit corpus and browser benchmark passed.
- Build: `dist/site` and `dist/app` produced. The checker bundle is 7.28 KB
  gzip; the landing bundle is 2.13 KB gzip.
- Dependency audit and shell-installer syntax checks passed.

The static deployment completed successfully at
<https://caption-placement-check.sociobot.in>. Fresh desktop (1440 × 900) and
phone (390 × 844) contexts showed the job, audience, and **Try it with sample
data** action before scrolling. The demo then showed its persistent sample
label, two alerts, two safer-position recommendations, and reset correctly.
The live checker also exported exactly two protected regions after keyboard
then pointer input.

`verify-url.sh` passed for the live root with no console errors, a title,
`lang`, one `h1`, a `main` landmark, and complete image/button labels. The
standalone Axe CLI could not start because the worker has no system Chrome
binary; the repository's Playwright Axe integration scanned root, demo,
checker, Privacy, Terms, and the designed 404 at both desktop and phone sizes
with zero serious or critical violations. The live demo also reloaded offline
after its first visit with its banner and two alerts. The expected designed
404 returned HTTP 404.

## Earlier findings

F-6-1 is resolved by the repeated 48/48 suite and live pointer-after-keyboard
check. The 29 findings in `.factory/review-1.md` remain resolved as recorded
in `.factory/polish-1.md` and rechecked in `.factory/verification-6.md`; this
repair did not alter billing, demo isolation, local processing, release
metadata, privacy, route structure, or accessibility behavior.

## Known gaps and operator action

- Detection is advisory. A human still needs to watch the final captioned
  export.
- No paid offer is currently advertised because product billing registration
  is unavailable. Free local scanning and CSV/JSON reports remain available;
  no checkout or license request is made.
- Desktop builds remain intentionally unsigned. Apple notarization and Windows
  Authenticode require operator-provided signing certificates.
- The v0.1.5 Linux AMD64 DEB checksum is
  `8df2288e6cf67b8364033946ac04affda2f5a107bfd103f8fbdf63fce78cce46`.
  Its extracted payload stayed running for eight seconds under a clean Xvfb
  consumer smoke test. The intentionally unsigned Windows build remains
  covered by the published-warning claim.
