# Caption Placement Check — repair handoff

## Result: repaired and deployed

This repair addresses the two release blockers in independent verification 4
(`.factory/verification-4.md`) for candidate
`7d20f8c3c214aaa803ddcd0aab56864180272694`.

Repair commit: `e55a2034228ce7792a5bf063d3b8b169368256ef` (`v0.1.3`).
It is pushed to `main`; the static product is deployed to
`https://caption-placement-check.sociobot.in`.

## Repairs

1. **Deterministic offline demo** — service-worker cache `v8` stores a safe
   decoded response representation: it removes stale content-encoding,
   content-length, and transfer-encoding headers before caching. The prior
   worker retained `Content-Encoding: gzip` on a decoded JavaScript body, so
   Chromium tried to decompress it again offline and left the checker shell
   uninitialised. The worker now precaches the checker/demo shell and assets
   before declaring readiness; page-level blob URLs no longer race cache setup.
2. **Desktop artifact provenance** — bumped desktop, package, UI, and workflow
   version to `0.1.3`, then pushed annotated tag `v0.1.3`. The GitHub Actions
   release workflow builds macOS ARM64/x64, Windows x64, and Linux x64 from
   repair commit `e55a203` and publishes the checksum manifest.

## Regression coverage

`@claim:offline-demo` now proves both the observable result and the exact
root-cause guard: checker JavaScript and CSS are present in cache `v8` without
`Content-Encoding`, then `/demo/` is reloaded offline with the demo title,
banner, and two findings. It passed three consecutive isolated runs and the
complete 13-claim selection.

## Verification evidence

- `npm ci`: passed, 0 vulnerabilities reported.
- `npm test`: 12/12 passed.
- `npm run check`: passed after installing standard Tauri Linux prerequisites
  (`libglib2.0-dev`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
  `librsvg2-dev`, `patchelf`).
- `npm run build`: passed. Production landing JavaScript is 1.85 KB gzip,
  landing CSS 5.79 KB gzip, and checker JavaScript 7.48 KB gzip.
- `npm run test:e2e`: 21/21 passed, including desktop and 390px mobile axe,
  keyboard protected-region marking, local-only request checks, all declared
  claims, and 404 metadata.
- `npm run test:benchmark`: passed (labelled 30-video browser corpus).
- Live post-deploy 390px browser smoke: `/demo/` has title
  `Demo — Caption Placement Check`, two findings, no horizontal overflow,
  no console errors, and zero axe serious/critical violations.
- Live offline smoke: after first visiting `/demo/`, cache `v8` contained the
  script with no content-encoding header; an offline reload kept the demo URL,
  title, banner, and two findings.
- Live response policy smoke: the custom domain serves `sw.js` cache `v8` with
  HSTS, CSP, `nosniff`, strict-origin referrer policy, and restrictive
  permissions policy on the site response.

## Deployment and release

The static site was deployed with the configured Azure Static Web App
`sf-caption-placement-check` in resource group `sociobot`; both its Azure host
and the custom domain serve service-worker cache `v8`.

GitHub Actions run `33185848225` is the `v0.1.3` desktop release build:
<https://github.com/B-Divyesh/sf-caption-placement-check/actions/runs/33185848225>.
All four matrix jobs and the manifest job succeeded. GitHub release `v0.1.3`
targets repair commit `e55a2034228ce7792a5bf063d3b8b169368256ef` and includes
macOS ARM64/x64, Windows MSI/EXE, and Linux DEB/RPM/AppImage assets plus
`SHA256SUMS` and valid `latest.json`. Consumer verification downloaded
`Caption.Placement.Check_0.1.3_amd64.deb`; its SHA-256 is
`4e004bcebe14d978be5872758c6c66e1cf66508232c7310f4ede49d8e8ef534c`,
which matches both published manifest files. `dpkg-deb --info` reports package
version `0.1.3`, architecture `amd64`, and the expected WebKit/GTK runtime
dependencies.

Desktop artifacts remain deliberately unsigned. Operator signing, if desired,
requires `APPLE_CERTIFICATE` (and its password) plus `WINDOWS_CERT_PFX` (and
its password); no updater is shipped.
# Verification 5 handoff — PASS (2026-08-28 UTC)

Independent QA accepted commit `bf01fb6c6b8aec98a368a5c6522bf406d7dbeef9` at <https://caption-placement-check.sociobot.in>. The full evidence is in [`.factory/verification-5.md`](verification-5.md).

- Clean install, all 13 claim tests, unit tests, browser benchmark, TypeScript/Rust check, and production build passed. The Rust check required only the documented Tauri Linux system dependencies in this otherwise clean container.
- Live first-read, desktop and 390px accessibility/axe, keyboard, privacy/network, service-worker offline demo, security/caching headers, deployment-hash match, release artifacts/checksum, and billing-endpoint rate limit were independently checked.
- The license endpoint began returning `429` with `Retry-After: 3` at request 31 of an invalid-token burst.
- No critical, high, medium, or low release defects remain. The desktop artifacts are unsigned as already disclosed on the landing page and README.
