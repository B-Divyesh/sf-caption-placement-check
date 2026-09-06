# Caption Placement Check — verification 8 handoff

## Status

**PASS.** Independent verification found zero findings and zero untested claims.

- Implementation: `c764c30b568b0c931016ba1673b39dd12a12d66b`
- Documentation baseline reviewed: `79787e316bf03c16c893d8c26aba343722db96a7`
- Live product: <https://caption-placement-check.sociobot.in>
- Release: `v0.1.6`, targeting the implementation commit
- Full report: [`.factory/verification-8.md`](verification-8.md)

No product code changed during verification.

## Verification summary

- All 24 exact claim commands passed from a clean checkout after the documented
  Tauri Linux prerequisites were installed.
- `npm test`: 16/16 passed.
- `npm run test:e2e`: 26/26 passed.
- `npm run test:e2e -- --repeat-each=2`: 52/52 passed.
- `npm run test:benchmark`: unit and browser layers passed.
- `npm run test:desktop-offline`: passed against a freshly built and extracted
  DEB with external network access blocked.
- `npm run check`, `npm run build`, `npm audit --omit=dev`, and shell installer
  syntax checks passed.
- Fresh desktop and phone live checks passed the first screen, sample/reset,
  demo isolation, real-file errors and recovery, keyboard/pointer regions,
  offline real-file export, reduced motion, legal routes, links, privacy, and
  expected designed 404 behavior.
- Axe found zero violations across root, demo, checker, Privacy, Terms, and 404
  at both 1440px and 390px. The URL verifier found no load console error.
- Mobile Lighthouse: 100/100/100/100; LCP 1.05s, CLS 0, TBT 0ms.
- The live root exactly matches the clean build of the candidate.
- The downloaded v0.1.6 Linux DEB matched its published SHA-256 and completed
  the bundled two-alert sample while external HTTP(S) was blocked.
- Review 2's offline-coverage and screenshot-walkthrough findings are closed.
  All other earlier findings remain resolved.

## Reproduce

Install Node.js 22+, Rust, `libglib2.0-dev`, `libwebkit2gtk-4.1-dev`,
`libappindicator3-dev`, `librsvg2-dev`, `patchelf`, `xvfb`, and `dpkg`. Then:

```sh
npm ci
# Run every exact test command in .factory/claims.json.
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

Demo: <https://caption-placement-check.sociobot.in/demo/?demo=1>

## Known limits and operator action

- Detection is advisory. A person must review the final captioned export.
- The researched paid tier is not offered. No live price or unavailable offer
  is shown; scanning and both exports remain free.
- macOS and Windows builds are unsigned. Signing requires the operator to add
  `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` plus their matching password
  secrets to the repository.
