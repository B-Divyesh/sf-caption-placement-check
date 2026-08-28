# Caption Placement Check v0.1.2 — repair handoff

## What changed

This repair addresses every release-blocking finding in independent verification
2 (`9fa652bd15a6f1c46698797e45140a88cbdc9f7b`):

- Added a labelled 30-video regression fixture with 24 critical collisions,
  six safe controls, and 12 caption languages. The shared density detector is
  now testable outside the browser; the benchmark measures 100% fixture recall
  and 0 false alerts per ten-minute video. See `.factory/benchmark.md`.
- Expanded `.factory/claims.json` and exact tagged browser coverage for local
  chosen-file processing, no-account CSV export, browser-only saved regions,
  no third-party requests, demo isolation, CSV rows, and an actual offline
  **reload**.
- Fixed the offline root cause: the versioned service worker now resolves a
  cached navigation pathname before its landing-page fallback. The regression
  clears registrations/caches, installs from `/demo/`, goes offline, reloads,
  and restores both findings.
- Removed the unavailable paid Studio offer after independently reproducing
  `GET https://api.sociobot.in/api/v1/products/caption-placement-check/checkout`
  returning HTTP 404. The features that had been gated (saved regions and JSON
  reports) are available locally without an advertised purchase. This is the
  closest honest release state until the factory registers a billing product.
- Replaced the nested review `aside` with a normal in-main container and moved
  skip links into headers. Populated demo axe checks now have no moderate,
  serious, or critical violations at desktop or 390px.
- Aligned package, Tauri, Cargo, site, and release-workflow metadata at
  `0.1.2` / `v0.1.2`.

## Verification

Completed from a clean dependency install on 2026-08-28:

```sh
npm ci
npm test                         # 12/12
npm run test:benchmark           # 1/1; 30 labelled scenarios
npm run build                    # dist/site and dist/app
npm run test:e2e                 # 12/12 Chromium checks
npm run check                    # TypeScript + Cargo check
sh -n public/install.sh
npm audit --omit=dev             # 0 vulnerabilities
```

- Every command listed in `.factory/claims.json` passed individually and in
  the full E2E suite.
- Playwright axe covered landing, populated demo at 1440px and 390px, checker,
  and legal pages. It found no serious/critical issues; the populated demo also
  had no moderate landmark/region issues. Keyboard coverage includes skip link
  and Arrow/Enter protected-region marking.
- An attempted standalone `@axe-core/cli` run could not locate a system Chrome
  in this container. The repository's Playwright Axe integration uses the
  pinned, preinstalled Chromium and passed the same route checks.
- Lighthouse mobile against the local production preview: Performance 98,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.8 s, LCP 1.8 s,
  CLS 0. Initial JS/CSS remain below the static budgets.
- `npm run tauri build` completed locally. Its consumer DEB reports
  `caption-placement-check` version `0.1.2` for `amd64` and SHA-256
  `b125be65fd6784997d657d7ec59aa83aecd6aceffb78c95ca3849a37f0c1d2d7`.
  The GitHub workflow remains the source of all release-platform artifacts.

## Deploy and release

Pushed repair commit `3d0ed628ba704874d510ec9568ae4c1300ad6a55` and tag
`v0.1.2`, then deployed `dist/site/` with:

```sh
swa deploy dist/site --env production --resource-group sociobot \
  --app-name sf-caption-placement-check --no-use-keychain
```

Live smoke checks at `https://caption-placement-check.sociobot.in` returned
HTTP 200 for `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/`. At 390px,
each has `lang=en`, one `h1`, a `main` landmark, the correct route title, the
v0.1.2 footer, and no console/page errors. GitHub Actions release run
`33172830156` completed successfully. Release `v0.1.2` now contains macOS
arm64/x64, Windows x64, Linux AppImage/DEB/RPM, `SHA256SUMS`, and
`latest.json`. The released DEB SHA-256
`7f57446282e20bf631fa7b2d3fa8cf9e85e3448278acc7611438e65f21901308`
matches `latest.json`.

## Known limits / next operator action

- The Sociobot billing product remains unregistered, so checkout is correctly
  not advertised. If a paid tier is restored, register the product first and
  use the hosted Sociobot checkout; add a live purchase regression before
  putting price or purchase copy back on the site.
- The benchmark is deterministic representative cue-midpoint frames, not a
  public claim of real-world accuracy. Extend it with rights-cleared production
  footage if broader field validation is needed.
- Desktop releases are unsigned. Signing needs the documented Apple and
  Windows certificate secrets; no updater is included.
