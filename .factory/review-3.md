# Check caption placement before publishing — review 3

**Verdict: PASS**

This strict review found **zero findings**: critical 0, high 0, medium 0, and
low 0. It also found **zero untested public claims**.

Reviewed on 2026-09-06 UTC from a clean checkout at documentation commit
`d545995b434982efaab03ebe647b9bde9e84bc7d`. The implementation candidate is
`c764c30b568b0c931016ba1673b39dd12a12d66b`; later commits are report-only.
The live product reviewed is <https://caption-placement-check.sociobot.in>.

## Job, audience, and first action

Before scrolling, fresh 1440 × 900 desktop and 390 × 844 phone browsers said:

- Job: **Check captions before they hide the video.**
- Audience: educators and creators who need a careful caption check before
  publishing.
- First action: **Try it with sample data**. Its adjacent text says it opens a
  sample review with two alerts.

The action ended at 593px on desktop and 664px on phone, within their initial
viewports. Both pages had one `main`, `lang="en"`, no horizontal overflow, and
no load error.

## Claims

All 24 exact commands declared in `.factory/claims.json` passed after `npm ci`
and the documented Linux Tauri prerequisites were installed. Each claim ID
appears in exactly one `@claim:<id>` test or in its stated standalone desktop
command. The public landing, checker, legal, and README wording matches the
register; no public claim is missing a repeatable sandbox proof.

| Claims | Result |
| --- | --- |
| `sample-demo`, `demo-isolation`, `media-local`, `no-account`, `saved-regions-local`, `no-tracking` | PASS |
| `offline-demo`, `offline-real-check`, `desktop-offline` | PASS |
| `local-scan`, `json-project-report`, `caption-formats`, `unicode-captions`, `local-detection`, `safe-zone-recommendations`, `manual-regions` | PASS |
| `release-cache`, `release-fallback`, `platform-selection`, `desktop-downloads`, `installer-checksum`, `unsigned-builds` | PASS |
| `benchmark-corpus`, `mit-license` | PASS |

The first packaged-desktop command in the pristine container stopped before an
app build because `glib-2.0` was absent. This is a documented Tauri Linux
prerequisite, not a product outcome. After installing the documented packages
(`libglib2.0-dev`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
`librsvg2-dev`, `patchelf`, `xvfb`, and `dpkg`), the exact command passed 1/1
in 64.98s. This setup-only attempt is recorded, not concealed.

## Live product checks

- Fresh desktop and phone contexts used the one-click sample. It opened
  `/demo/?demo=1`, showed two alerts and two safer-position recommendations,
  retained **Demo — sample data, nothing is saved**, and Reset demo restored
  both alerts.
- Each of root, demo, checker, Privacy, Terms, and an unknown URL was checked
  at both viewports. The normal routes returned 200; the designed unknown-route
  page returned the intended HTTP 404 with one `h1`, one `main`, a usable way
  home, route title, and no overflow.
- Axe reported no violations on all 12 live route/viewport checks. The
  repository and PATH do not contain the worker `verify-url.sh`; equivalent
  fresh-browser checks covered title, language, landmark, alt/accessible-name,
  layout, and console behavior. The only console resource message occurred
  when deliberately visiting the expected HTTP 404, so it is not a defect.
- The live root HTML SHA-256 equals the clean candidate build:
  `b176aad459f20b0e5e81f0b8086e60fd0624bb9fc4c206ca82bd8bbf8f55f9eb`.
  Live headers include CSP, HSTS, `nosniff`, strict-origin referrer policy, and
  a restrictive permissions policy.
- The full browser regressions exercise normal scanning, invalid files, empty
  captions, out-of-range caption timing, valid recovery, keyboard and pointer
  protected regions, reduced motion, offline reload and real-file export,
  privacy/network restrictions, links, release fallback, route focus, and the
  desktop packaged sample.

This is a local static/Tauri product. It has no product backend, account,
payment, updater, or runtime AI feature; tenant isolation, persistence restart,
health, 429, and billing checks do not apply.

## Quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 0 production vulnerabilities |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 26/26 |
| `npm run test:e2e -- --repeat-each=2` | PASS — 52/52 |
| `npm run test:benchmark` | PASS — unit corpus and browser benchmark |
| `npm run test:desktop-offline` | PASS — 1/1 after documented prerequisites |
| `npm run check` | PASS — TypeScript and Rust |
| `npm run build` | PASS — `dist/site` and `dist/app` |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `sh -n public/install.sh` | PASS |

The clean build contains 2.13 KB gzip landing JavaScript, 5.69 KB gzip landing
CSS, and 7.65 KB gzip checker JavaScript.

## Earlier findings

| Earlier review finding | Current disposition |
| --- | --- |
| Review 1’s purchase, demo isolation, offline, benchmark, release, copy, accessibility, metadata, and navigation findings | Resolved or honestly removed from scope; current claim, browser, and release-contract coverage passes. |
| Verification 2–4’s offline, benchmark, 404, desktop first-run, touch, package/version, and artifact findings | Resolved; current suites, designed 404, current candidate build, and packaged offline check pass. |
| Verification 6 pointer-region regression | Resolved; the exact claim and 52/52 repeated browser suite pass. |
| Review 2 F-2-1 offline proof coverage | Resolved; separate `offline-real-check` and `desktop-offline` repeatable claims pass. |
| Review 2 F-2-2 text-only walkthrough | Resolved; the landing page has three loaded 1280 × 820 captioned screenshots from the released desktop app. |

## Result

**PASS — zero findings and zero untested claims.** No product code was changed.
