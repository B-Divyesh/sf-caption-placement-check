# Check caption placement before publishing — review 2

**Verdict: FAIL**

Reviewed on 2026-09-06 UTC against
<https://caption-placement-check.sociobot.in>.

The implementation candidate is
`679c2566026bbeb1c5a0ed506f7e2866fe265317`. The documentation baseline is
`3a1e0e338a4a2d08d7c5bf8170cbcc31f123f0db`. The later commits between them
change only `.factory/verification-7.md` and `.factory/handoff.md`. Freshly
built HTML, route files, the service worker, robots file, and sitemap match the
live product byte for byte.

This review has **two findings**: one high and one medium. There are **two
untested public claims**. All 22 claims already declared in
`.factory/claims.json` passed their exact commands.

## Job, audience, and first action

Before scrolling, fresh desktop and phone browsers state:

- Job: **Check captions before they hide the video.**
- Audience: educators and creators checking captions before publishing.
- First action: **Try it with sample data**. The next line says it opens two
  alerts.

The action ended at 593px in the 1440 × 900 browser and 664px in the 390 × 844
browser. Both fit before the first scroll. Neither view had horizontal
overflow or a console error.

## Findings

### F-2-1 — Offline claims are outside the claim inventory

**Severity: high**

The landing page says **“Download the offline desktop app.”** The checker also
changes its status to **“Offline · local checks still work”** when the browser
goes offline.

The only offline entry in `.factory/claims.json` is `offline-demo`. Its claim
and test cover a cached reload of the shipped browser demo. They do not cover
either of these public outcomes:

1. A packaged desktop build works offline.
2. A user can choose their own files and complete a real browser check while
   offline.

Both outcomes passed manual checks in this review. The live browser processed
the supplied WebM and SRT after the context went offline. The installed DEB
also loaded its bundled sample and showed two alerts with external HTTP(S)
routed to an unreachable local proxy. Those spot checks establish current
behavior, but they do not meet the claims contract. Each public claim must be
listed and have one tagged repeatable sandbox test.

Add separate `desktop-offline` and `offline-real-check` entries with packaged
artifact and fresh-browser tests, or narrow the public words to the declared
browser-demo claim.

**Untested public claims: 2.**

### F-2-2 — The desktop walkthrough has no screenshots

**Severity: medium**

The desktop demo contract requires a captioned screenshot walkthrough with
three to five frames on the landing page. The current section says **“See the
installed app in four frames.”** Its four items contain only a number, title,
and short text. The section contains no screenshots.

The hero art and the separate CSS illustration are not views of the installed
app. Replace the four text cards with three to five captioned screenshots from
the released app. This reopens the walkthrough part of the earlier
verification-3 finding.

## Declared claims

Every exact command in `.factory/claims.json` ran independently after
`npm ci` in a clean clone at documentation SHA `3a1e0e3`.

| Claim | Result |
| --- | --- |
| sample-demo | PASS |
| demo-isolation | PASS |
| media-local | PASS |
| no-account | PASS |
| saved-regions-local | PASS |
| no-tracking | PASS |
| offline-demo | PASS |
| local-scan | PASS |
| json-project-report | PASS |
| caption-formats | PASS |
| unicode-captions | PASS |
| local-detection | PASS |
| safe-zone-recommendations | PASS |
| manual-regions | PASS |
| release-cache | PASS |
| release-fallback | PASS |
| platform-selection | PASS |
| desktop-downloads | PASS |
| installer-checksum | PASS |
| unsigned-builds | PASS |
| benchmark-corpus | PASS |
| mit-license | PASS |

Each declared claim ID appears exactly once as an `@claim:<id>` test tag.
F-2-1 records the two public offline claims missing from this inventory.

## Live product checks

- The one-click sample opened `/demo/?demo=1` with two alerts and two safer
  positions. The persistent demo label stayed visible. Reset restored both
  alerts.
- Seeded license, verdict, protected-region, and release-cache sentinels were
  never read or changed in demo mode. Demo traffic stayed same-origin and made
  no mutating request.
- A clean phone context cached the demo, went offline, reloaded, and retained
  its title, banner, and two alerts.
- The real checker started with its main action disabled. It rejected `.txt`
  captions, an empty SRT, and a caption beyond the two-second video. It then
  recovered with valid SRT input and checked both captions.
- Keyboard entry and a pointer drag created two protected regions. The JSON
  export contained both.
- Reduced-motion matching was active. Transitions reduced to `0.00001s`, and
  scroll behavior became `auto`.
- Keyboard navigation exposed a 3px orange focus ring. Route entry and Back
  focused and announced each new `h1`.
- Root, demo, checker, Privacy, Terms, and the designed 404 had one `h1`, one
  `main`, `lang="en"`, four header links, four footer links, and route-specific
  titles at desktop and phone sizes.
- Axe found no violation of any severity on those 12 route and viewport
  combinations. The factory URL verifier also passed with zero console errors.
- Normal routes returned 200. The unknown route returned the expected HTTP
  404 and provided a way home. This deliberate 404 is not a defect.
- All discovered same-origin links returned 200. The Privacy page provides
  `privacy@sociobot.in` for requests. External GitHub links identify their
  destination.
- The public site made only same-origin requests plus the declared GitHub
  release metadata request. No analytics or external font request appeared.

At 200% text size on the phone view, all text and controls remained present.
The document measured two CSS pixels wider than the viewport, but no content
was clipped or lost.

## Quality gates

| Check | Result |
| --- | --- |
| `npm test` | PASS — 16/16 |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:e2e -- --repeat-each=2` | PASS — 48/48 |
| `npm run test:benchmark` | PASS — unit corpus and browser benchmark |
| `npm run check` | PASS after documented Tauri Linux packages were installed |
| `npm run build` | PASS — `dist/site` and `dist/app` produced |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |
| `sh -n public/install.sh` | PASS |

The build produced 2.13 KB gzip of landing JavaScript, 5.71 KB gzip of landing
CSS, and 7.28 KB gzip of checker JavaScript. Lighthouse mobile scored 100 for
performance, accessibility, best practices, and SEO. It measured 0.9s LCP,
0 CLS, and 30ms total blocking time.

The required Linux packages used for the final Rust check were
`libglib2.0-dev`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
`librsvg2-dev`, and `patchelf`.

## Desktop release

GitHub release `v0.1.5` targets implementation `679c256`. It publishes macOS
arm64/x64, Windows MSI/EXE, Linux AppImage/DEB/RPM, `SHA256SUMS`, and
`latest.json`.

In a new temporary consumer directory, the Linux AMD64 DEB reported package
`caption-placement-check`, version `0.1.5`, architecture `amd64`. Its SHA-256
matched the published value:

```text
8df2288e6cf67b8364033946ac04affda2f5a107bfd103f8fbdf63fce78cce46
```

After its declared GTK and WebKit runtime packages were installed, the binary
stayed open for the eight-second smoke interval. The bundled sample was then
loaded from the app with external HTTP(S) unavailable. It displayed two
caption alerts, Arabic and Japanese text, and both free export actions.

The release is intentionally unsigned and says so before download. Signing is
an operational limitation, not a new defect.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Initial offline cache failures | Resolved for the declared browser demo. The exact claim, full suite, repeat suite, and fresh live offline reload passed. |
| Initial demo license reads and writes | Resolved. Seeded sentinel audit found zero reads, changes, or external demo requests. |
| Unavailable checkout and conflicting paid copy | Resolved by removing the offer. The checker and both exports are free. |
| Initial mobile legal link names and keyboard region access | Resolved. Axe is clean at both sizes, and keyboard region entry works. |
| Old release provenance and wrong platform selection | Resolved. v0.1.5 targets the implementation, and release, architecture, and checksum claims passed. |
| Missing or weak benchmark evidence | Resolved. The labelled 30-video unit and browser benchmark passed. |
| Broken 404, stale summary, cache headers, metadata, and small touch links | Resolved. Live routes, headers, metadata, touch layout, and the designed 404 passed. |
| Verification-2 landmark and package-version issues | Resolved. Axe reports no landmark issue, and tag, package, and site show 0.1.5. |
| Verification-3 native first-run sample | Resolved. The installed DEB loaded its sample and showed two alerts. |
| Verification-3 screenshot walkthrough | **Not resolved; recorded as F-2-2.** The four current items are text cards, not screenshots. |
| Review-1 F-1-5 and F-1-7 through F-1-18 | Resolved for Unicode, release caching and fallback, platform selection, installer hashes, benchmark, unsigned state, requests, downloads, and MIT licensing. |
| Review-1 F-1-19 through F-1-29 | Resolved for plain words, terminology, headings, shared shell, focus, icons, external-link labels, and checker title, except the offline wording reopened in F-2-1. |
| Verification-4 artifact and cache findings | Resolved by v0.1.5 and the passing clean offline regression. |
| Verification-6 F-6-1 pointer region reliability | Resolved. The claim passed alone, 48/48 repeated tests passed, and live JSON contained both keyboard and pointer regions. |

The absent paid offer remains an honest scope deviation. No backend, account,
payment flow, updater, or runtime AI feature is present, so their backend and
rate-limit checks do not apply. Cloud AI would conflict with the local media
job and is not missed leverage here.

## Result

**FAIL — 2 findings and 2 untested public claims.**

No product code was changed during this review.
