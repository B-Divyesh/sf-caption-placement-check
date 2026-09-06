# Check caption placement before publishing — verification 7

**Verdict: PASS**

This independent verification found **zero findings** (critical 0, high 0,
medium 0, low 0) and **zero untested declared claims**.

Verified on 2026-09-06 UTC from a clean checkout at documentation commit
`e51edc4dd818d2bc1f820e26326e9364908d923b`. The implementation candidate is
`679c2566026bbeb1c5a0ed506f7e2866fe265317`; `6d22f4e` and `e51edc4` are
verification/final-metadata documentation only. The live product reviewed was
<https://caption-placement-check.sociobot.in>.

## Job, audience, and first action

Before scrolling in fresh 1440 × 900 and 390 × 844 contexts, the page states:

- Job: **Check captions before they hide the video.**
- Audience: educators and creators who need a careful caption check before
  publishing.
- First action: **Try it with sample data**; it says a two-alert review opens.

The action was visible in both contexts (bottom at 593px desktop and 664px
phone). No horizontal overflow or browser console/page error occurred.

## Declared claims

After `npm ci` from the clean checkout, every exact command in
`.factory/claims.json` passed independently. Each command ran its tagged
observable sandbox test; 22/22 passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| sample-demo | PASS | `@claim:sample-demo` loaded two sample alerts without demo storage. |
| demo-isolation | PASS | `@claim:demo-isolation` preserved seeded real-data sentinels and rejected external traffic. |
| media-local | PASS | `@claim:media-local` scanned shipped local files without an upload. |
| no-account | PASS | `@claim:no-account` exported CSV and JSON without sign-in or purchase. |
| saved-regions-local | PASS | `@claim:saved-regions-local` wrote only after Save, under the local key. |
| no-tracking | PASS | `@claim:no-tracking` permitted only product and GitHub release metadata requests. |
| offline-demo | PASS | `@claim:offline-demo` reloaded a populated demo while offline. |
| local-scan | PASS | `@claim:local-scan` exported header plus two alert rows. |
| json-project-report | PASS | `@claim:json-project-report` exported a free two-finding JSON report. |
| caption-formats | PASS | `@claim:caption-formats` scanned SRT and positioned WebVTT. |
| unicode-captions | PASS | `@claim:unicode-captions` preserved Arabic and Japanese in UI and CSV. |
| local-detection | PASS | `@claim:local-detection` found portrait and dense overlap fixtures. |
| safe-zone-recommendations | PASS | `@claim:safe-zone-recommendations` rendered one move recommendation per alert. |
| manual-regions | PASS | `@claim:manual-regions` added keyboard and pointer regions. |
| release-cache | PASS | `@claim:release-cache` reused a current cached release response. |
| release-fallback | PASS | `@claim:release-fallback` exposed Releases without a console error. |
| platform-selection | PASS | `@claim:platform-selection` selected compatible OS/architecture packages. |
| desktop-downloads | PASS | `@claim:desktop-downloads` resolved release assets and published checksums. |
| installer-checksum | PASS | `@claim:installer-checksum` accepted a match and rejected a mismatch. |
| unsigned-builds | PASS | `@claim:unsigned-builds` verified the disclosed unsigned Windows package. |
| benchmark-corpus | PASS | `@claim:benchmark-corpus` verified 30 labelled video fixtures. |
| mit-license | PASS | `@claim:mit-license` verified the canonical MIT grant and metadata. |

The repaired outcome was also exercised directly against live `/check/`: with
the shipped WebM/SRT, Enter added a keyboard region, a pointer drag added a
second region, and exported JSON contained **exactly two** protected regions.

## Quality gates

| Check | Result |
| --- | --- |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:e2e -- --repeat-each=2` | PASS — 48/48 |
| `npm run test:benchmark` | PASS — unit corpus and browser benchmark |
| `npm run check` | PASS after documented Tauri Linux prerequisites were installed |
| `npm run build` | PASS — `dist/site` and `dist/app` produced |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `sh -n public/install.sh` | PASS |

The build reports landing JavaScript at 2.13 KB gzip and checker JavaScript at
7.28 KB gzip. The documented Linux prerequisites installed for the Rust/Tauri
check were `libglib2.0-dev`, `libwebkit2gtk-4.1-dev`,
`libappindicator3-dev`, `librsvg2-dev`, and `patchelf`.

## Live product checks

- Fresh desktop and phone demo flows reached `/demo/?demo=1`, retained the
  persistent **Demo — sample data, nothing is saved** label, populated two
  alerts and two recommendations, and Reset demo restored both alerts.
- A fresh phone demo became offline-ready, reloaded offline, and retained its
  Demo title, banner, and two alerts.
- Invalid/recovery exercise on live `/check/`: the primary check action was
  disabled initially; a `.txt` caption was rejected with the SRT/WebVTT
  instruction; an empty SRT and a caption past the 2-second video showed
  specific errors; a valid SRT then completed the two-caption scan.
- Live `/`, `/demo/`, `/check/`, `/privacy/`, `/terms/`, `/robots.txt`, and
  `/sitemap.xml` returned 200. The styled unknown route returned the expected
  HTTP 404 with a usable way back.
- Playwright Axe scans of root, demo, checker, Privacy, Terms, and 404 at
  both desktop and phone sizes found 0 serious and 0 critical violations.
  Every scanned page had one `h1`, one `main`, a route-specific title, no
  horizontal overflow, and no unexpected console error.
- The factory `verify-url.sh` passed on the live root: title, `lang="en"`,
  one `h1`, main landmark, image alt text, labelled buttons, and zero console
  errors. Normal live headers include CSP, HSTS, `nosniff`, strict-origin
  referrer policy, and a restrictive permissions policy. Hashed JS/CSS/image
  assets are `max-age=31536000, immutable`.
- All discovered same-origin navigation links returned 200 except the
  deliberate designed 404; legal email links and release downloads are
  explicit external destinations.

## Desktop release

GitHub release `v0.1.5` targets the candidate commit `679c256`. It publishes
macOS arm64/x64, Windows MSI/EXE, Linux AppImage/DEB/RPM, `SHA256SUMS`, and a
valid `latest.json` manifest.

In a new temporary consumer directory, the Linux AMD64 DEB had package
`caption-placement-check` version `0.1.5`. Its downloaded SHA-256 matched the
published manifest:

```text
8df2288e6cf67b8364033946ac04affda2f5a107bfd103f8fbdf63fce78cce46
```

After extraction, `/usr/bin/caption-placement-check` stayed running for the
full eight-second `xvfb-run` smoke interval. This is an intentionally unsigned
release, and the public disclosure/claim passed.

## Earlier findings and current disposition

All earlier reports and the 29-item `review-1.md` were inspected. Their former
offline-cache, demo-isolation, purchase-copy, mobile accessibility, metadata,
404, release-version, artifact-provenance, architecture selection, claims,
benchmark, copy, shell/navigation, and focus findings are resolved or honestly
removed from public scope. Current evidence is the 22/22 claim sweep, 48/48
repeated browser run, live checks above, and the v0.1.5 consumer artifact.

Specifically, F-6-1 is resolved: the former keyboard-then-pointer protected
region failure did not recur in the 48-test repeat or in the live exported
JSON exercise. The remaining absence of a paid offer is an honest documented
scope limitation: no unavailable checkout or license promise is displayed;
free local scanning and exports remain usable.

## Operational notes

Detection remains advisory; a publisher should watch the final captioned
export. macOS notarization and Windows Authenticode still need operator signing
certificates. Neither item is a current product defect or an untested public
claim.
