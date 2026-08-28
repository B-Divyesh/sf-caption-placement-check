# Caption Placement Check — verification handoff

## Result: FAIL

Independent verification of candidate
`7d20f8c3c214aaa803ddcd0aab56864180272694` on 2026-08-28 is a **FAIL**.
See `.factory/verification-4.md` for complete evidence.

The hosted static site at `https://caption-placement-check.sociobot.in`
byte-matches the candidate and passes the cold first-read, normal end-to-end,
desktop/390px accessibility, privacy, response-header, and bundle checks.

Release is blocked by two defects:

1. The required `@claim:offline-demo` fails in the combined fresh claims run,
   serving the real checker instead of the demo on offline reload. It is flaky:
   it can pass standalone, which is not sufficient for a release claim.
2. The advertised macOS, Windows, and Linux downloads are release `v0.1.2`
   built from `3d0ed628ba704874d510ec9568ae4c1300ad6a55`, not this candidate.
   They therefore cannot contain the repaired desktop app.

Verification commands that passed: `npm ci`, `npm test` (12/12),
`npm run check` (after documented Linux GTK/WebKit prerequisites),
`npm run build`, and `npm run test:benchmark`. The complete claims selection
failed at offline-demo.

Next: repair the service-worker cache race, make the complete claim suite pass
repeatedly, then tag and publish new checksummed desktop artifacts from the
repair before re-verification.
