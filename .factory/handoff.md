# Caption Placement Check — polish round 1 handoff

## Result

All 29 findings in `.factory/review-1.md` are resolved. There were no earlier review or polish reports. Repair validation and the static deployment were pushed at `1ac7fc138bfe03cdb7730360f6f007ba23ceabb3`; the existing desktop release `v0.1.4` was built from the preceding application repair commit `1647fea2ea7288c6c53d81dc939603f7e18da3da`.

The unavailable paid offer was removed because the repository cannot register billing infrastructure. JSON project reports are now free. The site makes no checkout or license request and does not advertise a paid tier.

## What changed

- Rewrote the first screen to state the job, audience, sample action, result, and three facts above the fold.
- Made `/?demo=1` enter the populated sandbox in one click with a persistent banner, Reset, and Start for real.
- Removed all demo access to real license state. Seeded real keys remain unread and unchanged.
- Made video seeking and frame readiness deterministic before detection.
- Shipped Arabic and Japanese sample captions and added observable Unicode coverage.
- Made JSON reports free and aligned landing, checker, Terms, Privacy, README, and tests.
- Added a 22-entry claim inventory with exactly one tagged test per claim.
- Strengthened release tests to resolve every supported package, verify responses, compare manifests, hash an installer, and inspect signing state.
- Added real route titles, metadata, 180 × 180 touch icon, designed 404, shared navigation/footer, arrival focus, announcements, legal links, and external-link labels.
- Reworked phone layout while preserving the projection-room visual system and original artwork.
- Updated `README.md`, `.factory/demo.md`, `.factory/design.md`, `.factory/copy-audit.md`, `.factory/catalog-description.txt`, and `.factory/polish-1.md`.

## Verification

Run from the repository root:

```sh
npm ci
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run build
npm run check
```

Recorded results on 2026-08-28:

- Every exact command in `.factory/claims.json`: 22/22 passed from a clean clone.
- Unit/integration: 16/16 passed.
- Browser: 24/24 passed; repeated full suite: 48/48 passed.
- Benchmark: 30/30 labelled videos passed.
- Build: passed; `dist/site` and the Tauri web bundle were produced.
- TypeScript and Rust: passed. The documented Linux Tauri packages were installed before `cargo check`.
- Dependency audit: zero vulnerabilities.
- Installer syntax checks: passed.
- Local verifier: `.factory/evidence/verify-final-local/verify.json` reports correct title, `lang`, one `h1`, `main`, alt text, labels, and zero console errors.
- Live verifier: root loaded in 1,185 ms and demo in 2,750 ms; both had zero console errors. See `.factory/evidence/polish-1-live-audit.json`.
- Live Axe: six routes at 390 × 844 and 1440 × 900 had no serious or critical violations.
- Live route audit: no horizontal overflow; route-specific titles, focus, shared navigation/footer, icon metadata, and 404 status all passed.
- Live privacy audit: seeded storage was unread and unchanged; demo traffic stayed same-origin.
- Live offline audit: the demo reloaded with its banner, two-caption summary, and two alerts.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 900 ms, CLS 0, TBT 62 ms.

Visual evidence is under `.factory/evidence/`. The finding-by-finding matrix is `.factory/polish-1.md`.

## Deployment and release

- Production: <https://caption-placement-check.sociobot.in>
- Deployment class: static Azure Static Web Apps, built with `npm run build:site` into `dist/site`.
- Desktop class: Tauri 2; GitHub Actions builds macOS arm64/x64, Windows x64, Linux AppImage, and Linux deb packages.
- Release: <https://github.com/B-Divyesh/sf-caption-placement-check/releases/tag/v0.1.4>
- Release workflow: <https://github.com/B-Divyesh/sf-caption-placement-check/actions/runs/33196238348>
- The deployment CLI created an ignored local credential file; it was deleted immediately and no secret was committed.

## Known gaps

No product or review finding remains open. Automated caption placement is advisory, as the interface states; users should still watch the final captioned export.

## Needs operator action

Current desktop builds are intentionally unsigned and tested as such. Add the repository signing secrets documented by the release workflow when Apple notarization and Windows Authenticode certificates become available.
