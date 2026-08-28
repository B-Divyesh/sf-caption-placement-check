# Caption Placement Check v0.1.2 — independent verification 3 handoff

## Result: FAIL

Independent QA on 2026-08-28 tested candidate
`fce27dff884faca80d7c61b359f23e94e7fbe3d3` and
`https://caption-placement-check.sociobot.in`. See
`.factory/verification-3.md` for complete evidence.

No product code was changed.

## Release blockers

1. The exact `@claim:offline-demo` command fails after the offline reload; the
   full E2E suite also fails the same test (11 passed, 1 failed). A failing
   declared claim is an automatic release failure. The landing and checker
   register one service worker as both `?revision=3` and `?revision=6`, causing
   an update cycle whenever users move between them.
2. The claimed 30-video accuracy benchmark is 30 metadata records over two
   synthetic pixel patterns, not a labeled 30-video set. It tests no face,
   real video, realistic false-alert opportunities, or non-Latin on-frame
   text. Current Chromium also exposes no `FaceDetector` implementation.
3. Public claims for SRT/WebVTT support, face/dense detection,
   recommendations, manual regions, JSON reports, and verified platform
   downloads are missing dedicated entries/tests in `.factory/claims.json`.
4. The live 404 page has a serious axe color-contrast failure: `#394440` on
   `#101313`, measured at 1.84:1.
5. The native app first-run screen has no **Load sample project** action, and
   the landing page lacks the desktop contract's three-to-five-frame
   walkthrough.
6. The researched one-time purchase is not implemented. No paid offer or
   billing endpoint is exposed because the Sociobot product is unregistered.

## Additional defects

- Mobile brand, platform, and footer links have click targets smaller than
  44×44 CSS px.
- `/check/`, `/demo/`, and the 404 omit required social metadata; the 404 also
  logs its expected 404 as a Chromium resource error.
- `.factory/copy-audit.md` incorrectly says every landing sentence is at most
  22 words; the final advisory paragraph has 26.

## Verified passes

- First-read and one-click web demo gate passed; the sample immediately shows
  two actionable findings, Reset demo works, and demo changes do not alter
  real stored preferences.
- Six of seven exact claim commands passed. `npm test` passed 12/12;
  `npm run check` passed after documented Linux prerequisites; `npm run build`
  produced `dist/site` and `dist/app`; `npm run test:e2e` passed 11/12.
- Normal SRT and non-Latin WebVTT flows, invalid-input recovery, keyboard
  protected-region editing, CSV/JSON export, local persistence, and no-upload
  behavior passed.
- Five normal routes pass desktop/390 px axe serious/critical checks, semantic
  smoke tests, visible focus, reduced motion, overflow, and console/page-error
  checks. Lighthouse mobile is 100/100/100/100 with LCP 0.92 s and CLS 0.
- The live deployment byte-matches the candidate production build. Security
  headers and immutable caching for hashed assets are present.
- Release v0.1.2 contains all required platform artifacts and manifests. A
  downloaded DEB and the one-line-installed AppImage matched their published
  SHA-256 values; the extracted DEB application launched under Xvfb.

## Before another release candidate

- Make the offline claim test reliable from a clean install and use one
  service-worker revision URL across every route.
- Replace the synthetic two-pattern benchmark with a rights-cleared labeled
  30-video corpus that includes faces, realistic dense text, motion, safe
  controls, and non-Latin on-frame text; measure real interval recall and
  false alerts per complete ten-minute video.
- Complete the claims inventory and add one observable demo test per claim.
- Fix the 404 contrast and all sub-44 px touch targets.
- Add the sample project to native first run and the required desktop
  walkthrough.
- Register the Sociobot billing product before restoring a one-time paid tier.

Unsigned releases remain an operator limitation. If signing is added, wire and
document `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` (plus their passwords) in
the release workflow; no updater is currently included.
