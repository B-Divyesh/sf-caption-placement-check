# Check caption placement before publishing — verification 8

**Verdict: PASS**

This independent verification found **zero findings**: critical 0, high 0,
medium 0, and low 0. It also found **zero untested claims**.

Verified on 2026-09-06 UTC from a clean checkout at documentation commit
`79787e316bf03c16c893d8c26aba343722db96a7`. The implementation candidate is
`c764c30b568b0c931016ba1673b39dd12a12d66b`; `79787e3` changes only handoff and
evidence files. The reviewed live product is
<https://caption-placement-check.sociobot.in>.

## Job, audience, and first action

Before scrolling, fresh 1440 × 900 and 390 × 844 browsers state:

- Job: **Check captions before they hide the video.**
- Audience: educators and creators checking captions before publishing.
- First action: **Try it with sample data**. The next line says it opens a
  sample review with two alerts.

The action ended at 593px on desktop and 664px on phone, within both initial
viewports. Neither first screen had horizontal overflow or a console error.

## Declared and public claims

All 24 exact commands in `.factory/claims.json` passed from the clean checkout.
Each claim ID occurs in exactly one `@claim:<id>` test. Public landing, checker,
legal, and README copy was cross-checked against the register; no unlisted or
untested public claim remains.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| sample-demo | PASS | Fresh demo completed with two alerts and no demo/application data write. |
| demo-isolation | PASS | Seeded real-data keys were not read, sent, or changed. |
| media-local | PASS | Chosen media completed a real scan without an upload. |
| no-account | PASS | CSV and JSON exported without account or purchase controls. |
| saved-regions-local | PASS | Storage changed only after the user chose Save. |
| no-tracking | PASS | Route audit allowed only product requests and GitHub release metadata. |
| offline-demo | PASS | A fresh cached demo reloaded offline with two alerts. |
| offline-real-check | PASS | A fresh offline checker scanned chosen files and exported one alert row. |
| desktop-offline | PASS | A fresh DEB build ran its bundled sample with external network blocked. |
| local-scan | PASS | Sample CSV contained the header and both alert rows. |
| json-project-report | PASS | Free JSON export contained both findings. |
| caption-formats | PASS | SRT and positioned WebVTT both completed scans. |
| unicode-captions | PASS | Arabic and Japanese stayed intact in the review and CSV. |
| local-detection | PASS | Repeated portrait and dense-frame fixtures produced alerts. |
| safe-zone-recommendations | PASS | Both sample alerts included move recommendations. |
| manual-regions | PASS | Keyboard entry and pointer drag produced two distinct regions. |
| release-cache | PASS | Current GitHub metadata was reused from the timed cache. |
| release-fallback | PASS | Failed and empty metadata states linked to Releases without console errors. |
| platform-selection | PASS | macOS, Windows, Linux, x64, and ARM64 selections matched available assets. |
| desktop-downloads | PASS | Current platform assets resolved and published hashes matched. |
| installer-checksum | PASS | Shell install accepted a match and rejected a mismatch; PowerShell guard exists. |
| unsigned-builds | PASS | The disclosed Windows package has no publisher signature. |
| benchmark-corpus | PASS | The repository contains and checks 30 labelled encoded videos. |
| mit-license | PASS | Package metadata and the canonical MIT grant agree. |

The first desktop-offline attempt was made before installing Tauri's documented
Linux system libraries and stopped at missing `glib-2.0`. Per the work order,
the documented prerequisites were then installed. The exact command passed in
223 seconds; the setup-only attempt is not treated as a product result.

## Live product checks

- The one-click action opened `/demo/?demo=1`. After scanning, it showed two
  alerts and two safer-position recommendations. The persistent **Demo —
  sample data, nothing is saved** label remained after review, and Reset demo
  restored both alerts.
- A direct demo visit preserved seeded license, verdict, protected-region, and
  release-cache sentinels exactly. It made no cross-origin or mutating request.
- The real checker began with its main action disabled. It rejected `.txt`
  captions, an empty SRT, and a caption at 00:01:39 beyond the two-second
  video. It then recovered with valid SRT input and checked both captions.
- Keyboard entry followed by pointer drag created two protected regions in the
  downloaded JSON report.
- In a fresh browser context, `/check/` was cached, reloaded offline, scanned
  real WebM/SRT files, showed one alert, and exported a two-line CSV.
- The three landing walkthrough frames loaded on phone and desktop at their
  declared 1280 × 820 dimensions. Each is an actual captioned app screenshot,
  and visual inspection confirms the sample, populated review, and reviewed
  state shown by the released interface.
- Root, demo, checker, Privacy, Terms, and the designed 404 each had one `h1`,
  one `main`, `lang="en"`, route-specific titles, consistent header/footer
  navigation, and no horizontal overflow at both viewports.
- Axe found no violation of any severity on those 12 route/viewport checks.
  The factory URL verifier also passed title, language, landmark, image-alt,
  button-label, and console checks.
- Keyboard traversal exposed a designed 3px orange focus outline. The skip
  link, route-heading focus/announcement, Back navigation, native controls,
  and protected-region editor also pass the browser regression.
- Reduced-motion mode matched and reduced transitions to 0.01ms with automatic
  scrolling. At 200% browser zoom, content and actions remained present.
- All same-origin navigation links returned 200. The unknown route returned
  the intended HTTP 404 and a styled way home; its browser resource message is
  the expected deliberate 404, not a defect. Privacy requests link to
  `privacy@sociobot.in`.
- The live site made only same-origin requests plus the documented GitHub
  release metadata request. No analytics, advertising, telemetry, external
  font, media upload, or runtime AI request was found.
- Response headers include CSP, HSTS, `nosniff`, strict-origin referrer policy,
  and a restrictive permissions policy. Robots and sitemap routes are valid.

This is a static/Tauri product with no product backend, account, payment flow,
updater, or runtime AI feature. Tenant, restart, health, 429, and license API
checks do not apply. No backend or licensing expansion was requested.

## Quality gates

| Check | Result |
| --- | --- |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 26/26 |
| `npm run test:e2e -- --repeat-each=2` | PASS — 52/52 |
| `npm run test:benchmark` | PASS — unit corpus and browser benchmark |
| `npm run test:desktop-offline` | PASS — packaged sample completed offline |
| `npm run check` | PASS — TypeScript and Rust |
| `npm run build` | PASS — `dist/site` and `dist/app` produced |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |
| `sh -n public/install.sh` | PASS |

The initial landing bundle is 2.13 KB gzip JavaScript and 5.69 KB gzip CSS;
the checker JavaScript is 7.65 KB gzip. Fresh mobile Lighthouse scored 100
performance, 100 accessibility, 100 best practices, and 100 SEO, with 1.05s
LCP, 0 CLS, 0ms total blocking time, and 98,955 transferred bytes.

The live root HTML SHA-256 exactly matched the clean candidate build:
`b176aad459f20b0e5e81f0b8086e60fd0624bb9fc4c206ca82bd8bbf8f55f9eb`.

## Released desktop artifact

GitHub release `v0.1.6` targets implementation `c764c30` and publishes macOS
arm64/x64, Windows MSI/EXE, and Linux AppImage/DEB/RPM assets with
`SHA256SUMS` and valid `latest.json` metadata.

In a new temporary consumer directory, the downloaded Linux package identified
itself as `caption-placement-check` 0.1.6 amd64. Its SHA-256 matched the
published value:

```text
bdde533afd3ce504ed22951a78f5ecab1fcd67c6e2d60057af27f154dbc86ac9
```

The released executable was extracted and launched under Xvfb with all external
HTTP(S) directed to an unreachable proxy. It loaded the bundled sample and
reported two captions, two alerts, two local requests, zero external requests,
and a passing offline result.

The release is intentionally unsigned and says so before download. macOS and
Windows signing certificates remain an operator action, not a product defect.

## Earlier findings

| Earlier findings | Current disposition |
| --- | --- |
| Review 1 F-1-1, F-1-3, F-1-11, F-1-12 | Resolved by removing the unavailable paid offer and license flow; both exports are free. |
| Review 1 F-1-2 | Resolved; the live sentinel audit and exact demo-isolation claim preserve real data and make no external demo request. |
| Review 1 F-1-4, F-1-5, F-1-13 | Resolved; detection repeats pass, Unicode is preserved, and both 30-video benchmark layers pass. |
| Review 1 F-1-6 through F-1-10 | Resolved; offline demo, release cache/fallback, platform selection, and installer checksum claims pass. |
| Review 1 F-1-14 through F-1-18 | Resolved; unsigned disclosure, request restrictions, released assets/checksums, and MIT coverage pass; public provenance copy was removed. |
| Review 1 F-1-19 through F-1-29 | Resolved; copy, terminology, headings, shared shell, focus, icon metadata, external labels, and route titles pass current audits. |
| Verification 2 benchmark, claim, purchase, landmark, and version findings | Resolved or honestly removed from scope; current benchmark, 24 claims, Axe results, and v0.1.6 package evidence pass. |
| Verification 3 offline, benchmark, 404, native sample, touch, metadata, copy, and service-worker findings | Resolved; current clean suites, live route audits, and released artifact pass. |
| Verification 4 offline-repeat and stale-artifact findings | Resolved; 52/52 repeated tests pass and v0.1.6 targets the implementation candidate. |
| Verification 6 F-6-1 pointer marking | Resolved; exact claim, 52/52 repeated suite, and live two-region JSON exercise pass. |
| Review 2 F-2-1 offline claim coverage | Resolved; both new exact outcome claims pass, including a real offline file check and packaged offline desktop check. |
| Review 2 F-2-2 text-only walkthrough | Resolved; three real captioned app screenshots load and were visually inspected on live desktop and phone layouts. |

## Result

**PASS — zero findings and zero untested claims.** No product code was changed.
