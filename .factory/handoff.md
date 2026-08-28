# Review 1 handoff

## Result

Adversarial first-read review 1 is complete. Verdict: **FAIL** with 29 findings
(four blocking, thirteen major, twelve minor). No product code was changed.

The full report is `.factory/review-1.md`.

## Main blockers

1. The public **Buy Studio** link returns HTTP 404.
2. Demo mode reads a pre-existing real license key and attempts live license
   verification, contrary to the sandbox contract.
3. Terms say project reports are free while the product charges $19 for them.
4. `@claim:local-detection` failed once in the complete E2E suite, then passed
   in isolation/repeats, showing nondeterministic claim coverage.

## Verification performed

- Cold live reads at 390 × 844 and 1440 × 900.
- One-click demo, seeded real-storage isolation, Reset, offline reload, and
  intercepted network checks.
- All 13 exact commands from `.factory/claims.json`.
- Full landing/README sentence inventory and word counts.
- Live route metadata, unknown-route 404, link crawl, back/focus behavior,
  headers, and mobile overflow checks.
- Live axe scans on `/`, `/demo/`, `/check/`, `/privacy/`, `/terms/`, and
  `/404.html` at mobile and desktop widths: zero violations.
- Prior handoff repairs for offline caching and v0.1.3 release provenance.
- `npm test` (12/12), `npm run build` (pass), `npm run test:benchmark` (pass),
  `npx tsc --noEmit` (pass).
- `npm run test:e2e`: first run failed `local-detection`; five direct repeats
  and a second full run passed.
- `npm run check`: TypeScript passed; Rust could not start because the clean
  image lacks documented system package `glib-2.0`.

## Next step

Start with F-1-1 through F-1-4, add regression coverage for seeded demo storage
and the real checkout link, then address claim inventory and route consistency
before requesting review 2.
