# Caption Placement Check — verification 7 handoff

## Status

**PASS.** Independent QA found zero findings and zero untested declared
claims for implementation `679c2566026bbeb1c5a0ed506f7e2866fe265317`.
The documentation baseline reviewed was
`e51edc4dd818d2bc1f820e26326e9364908d923b`; it and `6d22f4e` contain reports
and metadata only, not a later product image.

The live static product is <https://caption-placement-check.sociobot.in>.
GitHub release `v0.1.5` targets the same implementation commit.

## What was verified

- Clean `npm ci`, then all 22 exact commands in `.factory/claims.json`:
  22/22 passed with no untested entry.
- `npm test` (16/16), full browser suite (24/24), repeated browser suite
  (48/48), benchmark, TypeScript/Rust check, build, dependency audit, and
  installer shell syntax all passed.
- Fresh live desktop and 390px phone paths: first screen, one-click demo,
  two populated alerts and recommendations, reset, keyboard and pointer
  regions, JSON export, offline demo reload, invalid/boundary/recovery input,
  privacy/legal routes, headers, links, and designed 404.
- Live Axe on six routes at both viewport sizes found no serious or critical
  issue. `verify-url.sh` passed with no console errors.
- The v0.1.5 Linux AMD64 DEB matched published SHA-256
  `8df2288e6cf67b8364033946ac04affda2f5a107bfd103f8fbdf63fce78cce46`, reported
  version 0.1.5 after extraction, and stayed running for eight seconds under
  Xvfb in a clean temporary consumer directory.

## How to verify locally

Install Node 22+, Rust, and the Tauri Linux development packages:

```sh
sudo apt-get install libglib2.0-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run check
npm run build
```

For the complete public-claim sweep, run each `test` command listed in
`.factory/claims.json`. The demo is
`https://caption-placement-check.sociobot.in/?demo=1`.

## Known limitations and next steps

- Detection is advisory. Review the final captioned export with captions on.
- No paid offer is currently advertised because billing registration is not
  available. This is an honest scope limitation; local scanning and CSV/JSON
  exports are free and do not need an account.
- Desktop packages are intentionally unsigned. Operator action is needed for
  Apple notarization and Windows Authenticode certificates before signed
  distribution.
