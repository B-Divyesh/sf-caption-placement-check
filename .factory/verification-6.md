# Verify caption placement before publishing — verification 6

**Verdict: FAIL**

Verified on 2026-09-05 UTC from a new clone of `main` at
`cd9d1c3b72108ec5f89a3529c593902cc3d66927`, against
<https://caption-placement-check.sociobot.in>.

The implementation reviewed is
`1647fea2ea7288c6c53d81dc939603f7e18da3da`.  The later product-repair commit
`1ac7fc1` changes only tests and factory evidence, and `cd9d1c3` changes only
factory evidence and documentation.  The fresh production build's landing and
checker JS/CSS hashes matched the deployed files exactly.

## Decision

**FAIL — do not accept this candidate.** One public capability is not reliable
under the required repeated browser regression. There are no untested declared
claims: all 22 exact claim commands passed individually, but a repeated full
suite found the defect below.

## Job, audience, and first action

Before scrolling, fresh 1440 × 900 and 390 × 844 live browser contexts both
said:

- Job: **Check captions before they hide the video.**
- Audience: educators and creators checking captions before publishing.
- First action: **Try it with sample data**; it says that it opens a sample
  review with two alerts.

The primary action was visible without scrolling on both sizes.

## Finding

### F-6-1 — Pointer protected-region marking is not reliable in the repeated browser flow

**Severity: high**

The public claim `manual-regions` says: “A protected region can be marked with
a pointer or keyboard.” Its exact one-test command passed in isolation:

```sh
npm run test:e2e -- --grep @claim:manual-regions
```

However, the required repeated complete regression failed once:

```text
npm run test:e2e -- --repeat-each=2
47 passed, 1 failed (86.5 s)
@claim:manual-regions supports keyboard and pointer marking
Expected protectedRegions.length >= 2; received 1.
```

The retained Playwright error snapshot shows the keyboard region was added
(“Protected region added”), while the subsequent pointer drag did not create a
second region. This is a failed observable claim, not a test-only concern: a
creator can be unable to mark a protected area with the pointer. The check
must be made deterministic and the full repeated suite must pass before a
PASS can be issued.

Evidence: clean-clone `test-results/site--claim-manual-regions-5e714-eyboard-and-pointer-marking/error-context.md`.

## Claims and local checks

`npm ci` completed with 0 audited vulnerabilities. Every exact command in
`.factory/claims.json` passed from that clean clone: **22/22 passed, 0 failed,
0 untested**. This includes demo isolation, local media, free CSV/JSON,
offline demo, Unicode captions, detection, release downloads, installer hash
checking, unsigned-build disclosure, benchmark corpus, and MIT licensing.

Other checks:

| Check | Result |
| --- | --- |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:e2e -- --repeat-each=2` | **FAIL — 47/48** (F-6-1) |
| `npm run test:benchmark` | PASS — unit corpus plus browser benchmark |
| `npm run check` | PASS after documented Tauri Linux prerequisites were installed |
| `npm run build` | PASS — `dist/site` and `dist/app` produced |

## Live checks

The live page was opened in fresh phone and desktop Chromium contexts.

- Landing, demo, checker, Privacy, Terms, and styled 404 had one `h1`, one
  `main`, `lang="en"`, route-specific titles, no horizontal overflow, no
  browser console errors, and no Axe serious or critical violation at both
  390 × 844 and 1440 × 900.
- An unknown URL returned the designed page with HTTP **404**. This is an
  expected result, not a defect.
- The one-click demo populated to two alerts and two safer-position
  recommendations after its scan completed. Its persistent “Demo — sample
  data, nothing is saved” label remained after **Reset demo**; reset restored
  the two-alert sample.
- Seeded license, verdict, protected-region, and release-cache sentinels were
  neither read nor changed in demo mode. Demo traffic made no third-party
  request. A fresh demo context reloaded offline after its first visit with
  its title, banner, and two alerts.
- The live routes `/`, `/demo/`, `/check/`, `/privacy/`, `/terms/`,
  `/robots.txt`, and `/sitemap.xml` returned 200. `/does-not-exist` returned
  404. Headers include HSTS, CSP, `nosniff`, strict-origin referrer policy,
  and a restrictive permissions policy.

## Desktop artifact

The current GitHub release is `v0.1.4`, built from implementation commit
`1647fea`. The Linux AMD64 DEB checksum matched the published `SHA256SUMS`:
`3f220990261b0103bc237f002e019a12ba62c13874cbebf25ddf9789c9cca166`.
After installing the package-declared GTK/WebKit runtime dependencies, its
extracted installed payload launched under Xvfb and stayed running for the
eight-second smoke interval. The intentionally unsigned status is covered by
the passing release claim.

## Earlier findings: current disposition

The 29 findings in `review-1.md` were rechecked against the repair mapping in
`polish-1.md`.

| Earlier findings | Current evidence and disposition |
| --- | --- |
| F-1-1, F-1-3, F-1-11, F-1-12 | No checkout, paid tier, license UI, or license request remains; free CSV/JSON and Terms agree. Resolved. |
| F-1-2 | Seeded real-data sentinel audit showed no reads, writes, or external demo requests. Resolved. |
| F-1-4 | `local-detection` exact claim passed and the repeated suite's detection instances passed; no regression observed. Resolved. |
| F-1-5 | Arabic/Japanese display and CSV claim passed. Resolved. |
| F-1-6 | Fresh live demo cached and reloaded offline with its populated state. Resolved. |
| F-1-7 through F-1-10 | Release cache, fallback, platform selection, and installer SHA-256 exact claims passed. Resolved. |
| F-1-13, F-1-17, F-1-18 | 30-video corpus, real release assets/checksums, and MIT grant claims passed. Resolved. |
| F-1-14 | Published Windows installer has no publisher signature; site discloses it. Resolved. |
| F-1-15, F-1-16 | Public copy no longer makes the artwork-provenance claim; live request audit found only allowed product/GitHub release traffic and no analytics or external fonts. Resolved. |
| F-1-19 through F-1-24 | Current copy audit is clean, uses “alert” and “protected region,” and has plain standalone headings. Resolved. |
| F-1-25 through F-1-29 | All live routes have the shared shell, focus/announcement behavior, touch icon metadata, labelled external links, and the plain checker title. Resolved. |

F-6-1 is a new regression finding and prevents acceptance despite the earlier
findings remaining resolved.

## Reproduce

```sh
npm ci
# run every exact command in .factory/claims.json
npm test
npm run test:e2e
npm run test:e2e -- --repeat-each=2
npm run test:benchmark
npm run check
npm run build
```

For Linux `npm run check`, install the documented Tauri packages first:
`libglib2.0-dev`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
`librsvg2-dev`, and `patchelf`.
