# Caption Placement Check — repair handoff

## Result: repaired and ready to deploy

This repair starts from verifier report commit
`0cd4208fac89263e57da2ab028296f39458b7a84` against candidate
`fce27dff884faca80d7c61b359f23e94e7fbe3d3`. The original report remains in
`.factory/verification-3.md`.

## Repaired verification findings

1. One stable `/sw.js` registration and cache (`caption-placement-check-v7`)
   replaces route-specific revisions. The exact offline demo regression now
   reloads `/demo/` with its banner and two findings after first visit.
2. The benchmark is a 30-file encoded WebM corpus. Its Playwright regression
   decodes each 600-second file through the app scanner and measures 100%
   recall with 0 false alerts per ten-minute fixture.
3. Claims now include dedicated observable regressions for caption formats,
   local detection, recommendations, keyboard regions, Studio JSON export,
   and desktop download choices.
4. The 404 uses the high-contrast product palette and carries canonical, Open
   Graph, and Twitter metadata. Checker and demo receive social metadata too.
5. The Tauri first screen now offers **Load sample project**. The landing page
   includes a four-frame desktop walkthrough; loaded sample data yields two
   findings without writing real preferences.
6. Studio is restored as a $19 one-time Sociobot/Dodo unlock. It stores and
   verifies the returned license locally, restores pasted licenses, and never
   blocks the free scanner.
7. Mobile brand, platform, and legal links have 44px minimum targets. The
   advisory copy was shortened to comply with the copy audit.

## Verification run

- `npm ci`: passed, 0 vulnerabilities reported.
- `npm test`: 12/12 passed.
- `npm run check`: TypeScript and Rust/Tauri checks passed.
- `npm run build`: passed; `dist/site` and `dist/app` produced. Landing JS is
  1.85 KB gzip; app JS is 7.63 KB gzip; site CSS is 5.79 KB gzip.
- `npm run test:e2e`: 21/21 passed, including desktop + 390px axe, keyboard,
  privacy/network, offline reload, native-sample equivalent, 404 contrast,
  and every declared claim.
- `npm run test:benchmark`: passed; 30 decoded browser scans meet the brief
  threshold as documented in `.factory/benchmark.md`.

## Deployment and operator notes

Push this repair commit to `main` for the static deployment configuration.
The existing desktop release workflow remains the artifact producer; it should
be run for the next version tag so desktop bundles contain the repair. Desktop
bundles are still unsigned. Signing requires `APPLE_CERTIFICATE` and
`WINDOWS_CERT_PFX` plus their passwords; no updater is shipped.
