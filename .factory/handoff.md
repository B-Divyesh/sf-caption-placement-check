# Caption Placement Check — review 2 handoff

## Status

**FAIL.** Review 2 found two acceptance-contract gaps and two untested public
claims. Product code was not changed.

The implementation reviewed is
`679c2566026bbeb1c5a0ed506f7e2866fe265317`. The documentation baseline was
`3a1e0e338a4a2d08d7c5bf8170cbcc31f123f0db`. The live product matches a fresh
build of that implementation.

## Findings to repair

1. Add tagged claim coverage for the public desktop-offline and real-checker
   offline statements, or narrow those statements to the tested browser demo.
2. Replace the four text-only walkthrough cards with three to five captioned
   screenshots of the released desktop app.

Full evidence and earlier-finding dispositions are in
`.factory/review-2.md`.

## Passing evidence

- All 22 declared claim commands passed independently from a clean clone.
- Unit tests passed 16/16. Browser tests passed 24/24 and 48/48 when repeated.
- Benchmark, TypeScript/Rust check, build, dependency audit, and installer
  syntax passed.
- Fresh live desktop and phone checks passed for the first screen, populated
  sample, reset, demo isolation, offline reload, input errors and recovery,
  keyboard, pointer regions, exports, routes, legal pages, and the designed
  404.
- Axe found no violation on root, demo, checker, Privacy, Terms, or 404 at both
  viewport sizes. The factory URL verifier reported no console errors.
- Lighthouse mobile scored 100 in all four categories. LCP was 0.9s, CLS was
  0, and total blocking time was 30ms.
- Release v0.1.5 targets the implementation commit. The Linux DEB matched its
  published SHA-256 and ran after its declared dependencies were installed.
- The installed DEB loaded its bundled sample with external HTTP(S)
  unavailable and displayed two alerts.

## How to verify

Install Node 22+, Rust, and the documented Linux Tauri packages:

```sh
sudo apt-get install libglib2.0-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf
npm ci
# Run each test command in .factory/claims.json.
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run check
npm run build
```

The live demo is
<https://caption-placement-check.sociobot.in/?demo=1>.

## Known operational limits

- Detection is advisory. Review the final captioned export.
- The researched paid tier is not offered because billing registration is not
  available. Scanning and both exports remain free.
- macOS and Windows builds are unsigned. Signing certificates remain an
  operator action.
