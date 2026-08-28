# Polish round 1

Polished candidate `bf01fb6c6b8aec98a368a5c6522bf406d7dbeef9` against every finding in `review-1.md`. No earlier review or polish report exists in this repository.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Removed the unavailable Studio offer, checkout link, paywall, and license flow. JSON reports are free. | `free feature wording agrees across the landing page, checker, and terms`; `@claim:no-account`; [mobile first screen](evidence/first-screen-mobile.png); live `/` and `/demo/?demo=1` contain no purchase control. |
| F-1-2 | Removed every license read and verification request. Demo uses no storage namespace because it persists nothing. Reset reloads only shipped sample files. | `@claim:demo-isolation` seeds every former real key, spies on reads, edits, resets, and asserts unchanged values plus same-origin traffic; [populated demo](evidence/demo-review-desktop.png); cold live demo produced no external request. |
| F-1-3 | Made scanning, regions, recommendations, CSV, and JSON consistently free across the site, checker, README, and Terms. | `free feature wording agrees across the landing page, checker, and terms`; `@claim:no-account`; live `/terms/`. |
| F-1-4 | Attached the `seeked` listener before changing playback time and waits for decoded animation frames before pixel sampling. | `@claim:local-detection`; full browser suite repeated twice: 48/48; benchmark: 30 videos; clean live demo: two alerts online and offline. |
| F-1-5 | Removed “script-agnostic” marketing copy and shipped Arabic and Japanese demo captions. | `@claim:unicode-captions` checks rendered alerts and CSV bytes; [populated demo](evidence/demo-review-desktop.png); live `/demo/?demo=1`. |
| F-1-6 | Replaced the unproved desktop-offline promise with the precise browser-demo statement. | `@claim:offline-demo`; cold live online-to-offline reload retained the banner and two alerts. |
| F-1-7 | Added the release-cache claim and a controlled-clock request-count test. | `@claim:release-cache`. |
| F-1-8 | Added the release fallback claim, shortened its wording, and tests failed plus empty responses without console errors. | `@claim:release-fallback`; live download area provides the GitHub Releases fallback. |
| F-1-9 | Added pure platform selection logic and a macOS, Windows, Linux, x64, and ARM64 matrix. | `@claim:platform-selection`. |
| F-1-10 | Added controlled installer tests for matching and mismatched hashes, plus the PowerShell mismatch guard. | `@claim:installer-checksum`. |
| F-1-11 | Removed the unregistered paid tier and all license caching claims and code. | `@claim:demo-isolation`; `@claim:no-account`; repository search finds no runtime Sociobot license request. |
| F-1-12 | Removed license restore copy and controls with the unavailable paid tier. | `@claim:no-account`; live `/check/` has no restore field. |
| F-1-13 | Added the benchmark claim and validates the complete labelled corpus. | `@claim:benchmark-corpus`; `npm run test:benchmark` checks 30 videos. |
| F-1-14 | Kept the necessary unsigned warning and verifies release configuration plus the Windows PE certificate table. | `@claim:unsigned-builds`; live download warning on `/`. |
| F-1-15 | Removed generated-art provenance from public marketing copy. Provenance remains in the internal design record. | `npm run test:e2e -- --grep "route metadata"`; [desktop first screen](evidence/first-screen-desktop.png); live footer. |
| F-1-16 | Runs the GitHub release branch in tests and allows only same-origin plus `api.github.com`; analytics and external fonts are rejected. | `@claim:no-tracking`; cold live route audit found no console errors or analytics calls. |
| F-1-17 | Resolves every platform and architecture asset, requires successful responses, compares `latest.json` with `SHA256SUMS`, downloads one installer, and verifies its digest. | `@claim:desktop-downloads`; GitHub release `v0.1.4`. |
| F-1-18 | Added the MIT claim and canonical grant/package checks. | `@claim:mit-license`; `LICENSE`. |
| F-1-19 | Rewrote the README introduction as four short sentences. | `.factory/copy-audit.md`: README maximum is 15 words. |
| F-1-20 | Split and shortened the release fallback wording. | `.factory/copy-audit.md`; `@claim:release-fallback`. |
| F-1-21 | Removed obsolete license wording. | `.factory/copy-audit.md`; repository search and `@claim:no-account`. |
| F-1-22 | Replaced implementation jargon and unmeasured adjectives with task language. | `.factory/copy-audit.md` has no banned-word or over-22-word flags; [mobile first screen](evidence/first-screen-mobile.png). |
| F-1-23 | Uses “alert” for every review result and “protected region” for user-defined areas. | `.factory/copy-audit.md` terminology table; `@claim:local-scan`; [demo mobile](evidence/demo-first-screen-mobile.png). |
| F-1-24 | Replaced vague headings with standalone task headings. | `.factory/copy-audit.md`; [desktop first screen](evidence/first-screen-desktop.png); live heading audit on all routes. |
| F-1-25 | Gave all six routes the same wordmark, four-link navigation, product sentence, legal links, factory credit, and version footer. | `route metadata, shared shell, and mobile layout stay complete`; live audit at 390 and 1440 pixels found four header and four footer links on every route. |
| F-1-26 | Added a shared arrival handler that focuses each `h1` and announces its route title, including Back navigation. | `route navigation and Back focus and announce each h1`; cold live forward/Back focus audit. |
| F-1-27 | Added an original 180 × 180 PNG touch icon and favicon/touch metadata to every route, including 404. | `route metadata, shared shell, and mobile layout stay complete`; live audit reported `180x180` on all routes. |
| F-1-28 | Marked every GitHub source, release, and asset link with visible `↗` text and an accessible external-site name. | `external links identify their destination`; live link crawl. |
| F-1-29 | Changed the checker title to “Caption Placement Check — check captions on a video.” | `route metadata, shared shell, and mobile layout stay complete`; live `/check/`. |

## Round evidence

- Clean clone: all 22 exact commands from `.factory/claims.json` passed.
- Unit and integration tests: 16/16 passed.
- Browser tests: 24/24 passed, then 48/48 with `--repeat-each=2`.
- Build: `npm run build` produced `dist/site` and the Tauri web bundle.
- TypeScript and Rust: `npm run check` passed after installing the documented Linux Tauri packages.
- Accessibility: all six live routes passed Axe at 390 × 844 and 1440 × 900 with no serious or critical issue.
- Live structure: all routes have `lang`, one `h1`, `main`, route titles, shared navigation/footer, focus arrival, no overflow, and no console error.
- Privacy: seeded demo storage remained unread and unchanged; the demo made no third-party request.
- Offline: a cold live demo reload retained its title, banner, summary, and two alerts.
- Performance: Lighthouse mobile scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 900 ms, CLS 0, and TBT 62 ms.
- Deployment: <https://caption-placement-check.sociobot.in>

There are no unresolved review findings.
