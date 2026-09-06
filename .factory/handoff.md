# Caption Placement Check — repair 7 handoff

## Status

**PASS.** Both review 2 findings are fixed. The implementation is
`c764c30b568b0c931016ba1673b39dd12a12d66b`. The live site and release
`v0.1.6` use that commit. This handoff and its evidence are a later
documentation-only commit, so they do not require another product deployment.

## What changed

- Added an outcome-based browser claim for a real SRT and video check after an
  offline reload. The test uses a fresh browser context, exports the alert CSV,
  and checks its data.
- Added an outcome-based packaged desktop claim. It builds the Linux DEB,
  extracts it into a clean consumer directory, blocks external HTTP and HTTPS,
  launches the installed executable, and checks the bundled sample result.
- Moved the existing offline demo claim into its own browser context.
- Fixed the checker so an offline reload reports its network state on first
  paint.
- Replaced the text-only walkthrough with three captioned screenshots captured
  directly from the packaged Linux app. Their source and method are recorded in
  `.factory/design.md`.
- Added browser coverage for screenshot loading, dimensions, and captions.
- Bumped the product and release workflow to `0.1.6` and refreshed the service
  worker cache.
- Updated the README, claims register, design record, and copy audit.

## Review finding disposition

1. **Offline desktop and real-checker claims lacked tagged tests — fixed.**
   `.factory/claims.json` now declares `desktop-offline` and
   `offline-real-check`. Each has exactly one tagged outcome test.
2. **Desktop walkthrough used text cards — fixed.** The landing page now shows
   three real, captioned app screenshots at 1280×820 pixels. Desktop and phone
   browser checks confirm that all three load and render.

Earlier findings remain fixed: the demo is isolated and resettable; the checker
handles real local files; error and recovery paths work; offline demo reload is
tested; the benchmark contains 30 encoded videos; release checks cover all
platforms; legal, privacy, 404, navigation, accessibility, and installer paths
remain covered.

## Verification

From a clean clone of the implementation commit:

- All 24 commands declared in `.factory/claims.json` passed independently.
- `npm test`: 16/16 passed.
- `npm run test:e2e`: 26/26 passed.
- `npm run test:e2e -- --repeat-each=2`: 52/52 passed.
- `npm run test:benchmark`: 1/1 unit and 1/1 browser benchmark passed.
- `npm run check`: TypeScript and Rust checks passed.
- `npm run build`: passed and produced `dist/site` and `dist/app`.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `sh -n public/install.sh`: passed.
- `npm run test:desktop-offline`: the extracted DEB completed the bundled
  sample with 2 captions and 2 alerts while external HTTP and HTTPS were
  blocked.

The static site was deployed to
<https://caption-placement-check.sociobot.in>. Its root HTML SHA-256 matched the
local build. Fresh desktop and 390-pixel phone checks passed the first screen,
one-click sample, persistent demo label, reset, real-data isolation, normal and
invalid inputs, boundary errors, recovery, offline checking, exports, legal
routes, and the expected designed 404. Axe found no serious or critical issue
on any public route at either viewport. The URL verifier reported no console
errors, missing alternative text, or unlabeled buttons.

Live mobile Lighthouse scores were 100 performance, 100 accessibility, 100
best practices, and 100 SEO. LCP was 0.9 seconds, CLS was 0, and total blocking
time was 0 milliseconds. Initial bundle sizes were 2.13 KB gzip for landing
JavaScript and 5.69 KB gzip for landing CSS.

GitHub Actions published `v0.1.6` for macOS arm64/x64, Windows x64, and Linux
x64. `latest.json` is valid, every listed hash matches `SHA256SUMS`, and the
downloaded Linux DEB hash was
`bdde533afd3ce504ed22951a78f5ecab1fcd67c6e2d60057af27f154dbc86ac9`.
The downloaded package also passed the blocked-network smoke. The live Linux
button resolves to the `v0.1.6` AppImage without a console error.

Evidence is under `.factory/evidence/repair-7-*`.

## Clean setup and commands

Use Node 22+, Rust, and the Linux Tauri test dependencies:

```sh
sudo apt-get install libglib2.0-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf xvfb dpkg
npm ci
# Run every exact `test` command in .factory/claims.json.
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run test:desktop-offline
npm run check
npm run build
npm audit --omit=dev
sh -n public/install.sh
```

The demo URL is
<https://caption-placement-check.sociobot.in/demo/?demo=1>.

## Known limits and operator action

- Detection is advisory. A person must review the final captioned export.
- The researched paid tier is not offered because billing registration remains
  unavailable. No live price or offer was invented. Scanning and both exports
  remain free.
- macOS and Windows builds are unsigned. Signing requires the operator to add
  `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` plus their matching password
  secrets to the repository.
