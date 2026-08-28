# Adversarial first-read review 1 — Caption Placement Check

**Verdict: FAIL**  
**Reviewed:** 2026-08-28 UTC  
**Live site:** <https://caption-placement-check.sociobot.in>  
**Repository base:** `94b9afbb71b75a010163b211251cfe172fe2bafd`

There are 29 findings: four blocking, thirteen major, and twelve minor. The
first screen and the populated sample are clear, but purchase is broken, demo
mode reads real license state, the terms contradict the paid offer, and a
listed detection claim failed once in the complete suite.

## 1. Cold first read

Fresh Chromium contexts were used without scrolling.

| View | What does this do? | For whom? | What should I click first? | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | It finds captions that cover important parts of a video. | Educators and creators checking before publishing. | **Try it with sample data**. | Clear; the headline, audience sentence, primary action, explanation, and three facts all fit above the fold. |
| 1440 × 900 | It checks whether captions hide meaningful video content. | Educators and creators. | **Try it with sample data**. | Clear; the action is visible before scrolling. |

Exact first-screen text used for that conclusion:

- “Find captions that hide important video.”
- “For educators and creators who need a careful caption check before publishing.”
- “Try it with sample data”
- “Opens a short sample review with two caption cues.”

This part is not blocking.

## 2. Findings

### Blocking

#### F-1-1 — The paid product cannot be purchased

- **Quote/location:** “Buy Studio” and “Hosted checkout.” on the landing page
  and checker.
- **Evidence:** A live `GET` and `HEAD` to
  `https://api.sociobot.in/api/v1/products/caption-placement-check/checkout`
  both returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
- **Impact:** A visitor who decides to buy reaches an API error instead of a
  checkout. This is a dead primary commercial action.
- **Fix:** Enable the product in the Sociobot billing API or remove the paid
  offer until checkout exists. Add a non-purchasing integration test that
  follows the exact public link to a valid hosted checkout response.

#### F-1-2 — Demo mode reads real license data and sends it away

- **Quote/location:** Demo banner: “Demo — sample data, nothing is saved.”
  `.factory/demo.md` additionally says demo “never reads or writes the real
  license or Studio preset keys.”
- **Evidence:** I seeded `sb_license:caption-placement-check=license-sentinel`
  and `cpc:protected-regions=preset-sentinel`, then entered the demo from the
  landing page. The live demo attempted
  `https://api.sociobot.in/.../verify?license=license-sentinel` on load and
  again after **Reset demo**. The requests were intercepted and blocked. The
  preset was not changed, and demo edits were not saved.
- **Code cause:** `src/app.ts:381-384` reads and verifies the real license
  regardless of `isDemo`; only preset saving is guarded at `src/app.ts:394-398`.
- **Impact:** The demo is not isolated from real data and can disclose a real
  license token while claiming sandbox behavior.
- **Fix:** Skip query-license handling, real license reads, verification, and
  real license UI whenever `isDemo` is true. Add a claim test that seeds all
  real keys before opening `/demo/`, intercepts every request, exercises edit
  and Reset, and confirms the sentinels remain unread/unmodified and no
  third-party request occurs.

#### F-1-3 — The terms say a paid feature is free

- **Quote/location:** `/terms/`: “Core scanning, safe-zone recommendations,
  manual protected regions, CSV export, saved regions, and project reports are
  available without purchase.” Landing page: “Studio is for teams and creators
  who keep structured project reports.” Checker: “Export JSON · Studio” is
  disabled without a license.
- **Impact:** A buyer cannot tell whether project reports cost $19. The legal
  page promises access without purchase while the product withholds it.
- **Fix:** Change the terms to: “Core scanning, safe-zone recommendations,
  manual protected regions, saved regions, and CSV export are free. JSON
  project reports require a $19 Studio license.” Add a cross-page pricing test.

#### F-1-4 — A listed detection claim is nondeterministic

- **Quote/location:** Claim `local-detection`: “Flags possible face and dense
  visual overlap on this device.”
- **Evidence:** The isolated command passed. The first complete
  `npm run test:e2e` run then failed at `tests/e2e/site.spec.ts:178`: expected
  one `#findings li`, received zero after 20 seconds. A direct five-repeat run
  and a second complete run passed.
- **Impact:** Any failing claim test is blocking. A timing-dependent detector
  can tell a visitor that a known overlap is clear.
- **Fix:** Make frame decode/seek readiness deterministic before pixel analysis
  and retain a repeated full-suite regression. The claim should pass from a
  clean context every time, not only in isolation.

### Major

#### F-1-5 — Non-Latin and script-agnostic support is an unlisted claim

- **Quote/location:** Landing: “Script-agnostic visual density heuristic.”
  README: “Parses SRT and WebVTT, including cue position settings and non-Latin
  text.”
- **Evidence:** `caption-formats` uses English SRT/VTT fixtures. A separate unit
  test retains non-Latin CSV text, but no `@claim:` test proves the public
  parsing/detection wording through the sandbox.
- **Fix:** Add a claim entry and a shipped sample containing representative
  non-Latin captions, then assert parse, display, and export. Otherwise remove
  “script-agnostic” and “non-Latin” from public copy.

#### F-1-6 — The desktop offline claim is not tested

- **Quote/location:** “Install the small desktop app for dependable offline
  reviews.”
- **Evidence:** `offline-demo` only reloads the web demo through a service
  worker. It does not launch a packaged desktop build offline.
- **Fix:** Add a packaged-app offline smoke test or rewrite this as the tested
  web behavior: “The browser demo works offline after your first visit.”

#### F-1-7 — Release-metadata caching is an unlisted claim

- **Quote/location:** README: “The landing page reads release metadata from the
  CORS-enabled GitHub Releases API and caches a successful result for one
  hour.”
- **Fix:** Add a tagged claim test with a controlled clock and request count, or
  remove the caching duration from public documentation.

#### F-1-8 — Release fallback behavior is an unlisted claim

- **Quote/location:** README: “If GitHub has no release or cannot be reached,
  it calmly links to the Releases page instead of failing in the browser
  console.”
- **Evidence:** There is an untagged fallback test, but no corresponding
  `claims.json` entry and the sentence is 23 words.
- **Fix:** List and tag the behavior, test both empty and failed responses, and
  use the shorter rewrite in the copy audit below.

#### F-1-9 — Operating-system and architecture selection is unlisted

- **Quote/location:** README: “The landing page detects the operating system
  and only selects a matching architecture when the browser provides one.”
- **Fix:** Add a tagged matrix test for macOS/Windows/Linux and x64/ARM64, or
  state only that the visitor chooses a build.

#### F-1-10 — Installer checksum verification is unlisted

- **Quote/location:** README: “Terminal installers download and verify SHA-256
  before opening/installing a matching asset.”
- **Fix:** Add a tagged test that runs each installer in a temporary directory
  against controlled assets and proves mismatch rejection, or remove the
  promise.

#### F-1-11 — License caching and non-blocking behavior is unlisted

- **Quote/location:** README: “A license token is stored only in browser storage
  and checked at most once daily; the free checker never waits for that check.”
- **Fix:** Add a tagged test with a controlled clock, offline state, slow
  verification response, and network interception. Split the sentence as
  proposed below.

#### F-1-12 — Cross-device license restore is unlisted

- **Quote/location:** Landing: “License restore on your devices.” README: “Use
  Restore a license in the checker to move Studio to another device.”
- **Fix:** Add a claim and test the receipt-token restore flow on fresh storage,
  or change the copy to the narrower tested behavior.

#### F-1-13 — The benchmark guarantee is absent from `claims.json`

- **Quote/location:** README: “It decodes each shipped ten-minute WebM fixture
  through the browser scanner and guards the brief threshold without making a
  public accuracy promise.”
- **Evidence:** `npm run test:benchmark` passed, but this public claim has no
  claim entry or `@claim:` tag.
- **Fix:** Add it to `claims.json` using the existing benchmark command, or move
  the implementation detail out of public README copy.

#### F-1-14 — Unsigned-build status is unlisted

- **Quote/location:** “Builds are unsigned while the project is new” and README
  “Early desktop builds are unsigned.”
- **Fix:** Keep the important warning, but list it and test the published
  artifacts’ signing state on every release.

#### F-1-15 — Artwork provenance is an unlisted public claim

- **Quote/location:** Footer: “Original generated environmental artwork.”
- **Fix:** Either remove this from public claim copy or add a provenance check
  tying the shipped asset checksum to the recorded generation metadata.

#### F-1-16 — The no-tracking test skips production-only traffic

- **Quote/location:** Footer: “No tracking.” Claim `no-tracking` says every
  request is same-origin in its sandbox.
- **Evidence:** `src/site.ts` calls GitHub only when the hostname is the live
  production hostname, while the test runs at `127.0.0.1`; therefore the test
  cannot observe that branch. A cold live landing load contacted
  `api.github.com`. That request is release metadata rather than observed
  tracking, but the stated same-origin proof is false for production.
- **Fix:** Test the production branch with the hostname injected and assert an
  explicit allow-list and absence of analytics endpoints. Make the sandbox
  description match the narrower claim.

#### F-1-17 — The desktop-download claim test does not prove downloads or checksums

- **Quote/location:** Claim `desktop-downloads`: “Offers macOS, Windows, and
  Linux desktop downloads with published checksums.”
- **Evidence:** The test only checks that three `href` values contain
  `/releases/` and that status text contains “checksums.” It does not fetch the
  artifacts or compare any digest. Manual live inspection found the three
  links and `SHA256SUMS`, but the required automated proof is missing.
- **Fix:** Resolve every platform/architecture asset, require HTTP 200, download
  a bounded fixture or manifest, and compare published digests.

### Minor

#### F-1-18 — The MIT-license sentence is outside the claim inventory

- **Quote/location:** README: “The software is MIT licensed.”
- **Evidence:** `LICENSE` is an MIT license, so the statement is true but not
  represented in `claims.json`.
- **Fix:** Add a lightweight claim test for the license text or treat this as
  explicitly exempt provenance in the claims policy.

#### F-1-19 — README introduction exceeds 22 words

- **Quote:** “Pair a final video with SRT or WebVTT captions; the app samples
  each timed cue, flags overlap with faces and visually dense regions,
  recommends an alternate zone, and produces a review list.” (32 words)
- **Fix:** “Pair a final video with SRT or WebVTT captions. The app checks each
  caption for overlap. It suggests a safer position and builds a review list.”

#### F-1-20 — README fallback sentence exceeds 22 words

- **Quote:** “If GitHub has no release or cannot be reached, it calmly links to
  the Releases page instead of failing in the browser console.” (23 words)
- **Fix:** “If GitHub is unavailable, the page links to Releases. It does not
  log a browser error.”

#### F-1-21 — README license sentence exceeds 22 words

- **Quote:** “A license token is stored only in browser storage and checked at
  most once daily; the free checker never waits for that check.” (23 words)
- **Fix:** “The license token stays in browser storage. It is checked at most
  daily, and the free checker does not wait for it.”

#### F-1-22 — User-facing copy uses unexplained jargon and a marketing adjective

- **Quotes/locations:** “Local accessibility preflight,” “timed cue,”
  “visual-density heuristic,” “CORS-enabled GitHub Releases API,” “labelled
  30-video placement regression corpus,” and “dependable offline reviews.”
- **Impact:** A first-time creator must translate implementation language;
  “dependable” is unmeasured marketing copy.
- **Fix:** Prefer “Check caption placement on your device,” “caption,” “checks
  visually busy areas,” “GitHub release data,” “set of 30 labelled test
  videos,” and the exact tested offline statement.

#### F-1-23 — One result has four names

- **Quotes/locations:** “warning,” “alert,” “finding,” and “cue needs a closer
  look” all name the review result across the landing page and checker.
  “Protected area” also changes the established “protected region” term.
- **Impact:** Visitors cannot build one stable mental model.
- **Fix:** Use **alert** everywhere: “Review alerts,” “2 alerts need a closer
  look,” and “Export alerts.” Use **protected region** everywhere.

#### F-1-24 — Several headings do not make sense out of context

- **Quotes:** “The preflight bench,” “One focused pass before release,” “Make
  the call,” “Your footage. Your machine.” and “Repeatable reviews, one
  payment.”
- **Fix:** Use “How caption checking works,” “Check placement before
  publishing,” “Review and export alerts,” “Download the offline desktop app,”
  and “Save JSON reports with Studio.”

#### F-1-25 — Header and footer structure changes by route

- **Evidence:** The landing header has Demo/How it works/Download. `/demo/` and
  `/check/` have no nav. Privacy, Terms, and 404 also have no header nav. The
  landing footer has the wordmark and six links; app, legal, and 404 footers
  use different content and link sets.
- **Fix:** Reuse one header/footer component on every route, with wordmark,
  Demo, checker, Privacy, Terms, one product sentence, factory credit, and
  version.

#### F-1-26 — Route changes do not move focus to the new page heading

- **Evidence:** After navigating `/` → `/demo/`, `document.activeElement` was
  `BODY`; after Back to `/`, it was also `BODY`.
- **Fix:** On internal route arrival and back/forward restoration, focus the new
  `h1` with `tabindex="-1"` and announce it in a polite live region. Add a
  browser test for both forward and Back navigation.

#### F-1-27 — Icon metadata is incomplete

- **Evidence:** Every normal route uses the SVG itself as
  `apple-touch-icon`; there is no 180 × 180 touch icon. The designed 404 has no
  favicon or touch icon at all.
- **Fix:** Ship an original 180 × 180 PNG, reference it on every route, and add
  both icon links to `404.html`.

#### F-1-28 — External links are not identified as external

- **Locations:** GitHub **Source**, release/download links, and the Sociobot
  checkout link have no visible or accessible “opens external site” notice.
- **Fix:** Add concise visible text or accessible names such as “Source on
  GitHub (external)” and “Buy Studio on Sociobot (external).”

#### F-1-29 — The checker title uses internal jargon

- **Quote/location:** `/check/`: “Caption Placement Check — local video
  preflight.”
- **Fix:** Use “Caption Placement Check — check captions on a video.” Keep the
  demo, Privacy, Terms, and 404 route-specific title patterns.

## 3. Copy audit

Counting method: visible sentence text, with hyphenated terms and URLs counted
as one word. Headings, fragments, and actions are audited separately below.

### Landing-page sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 6 | Find captions that hide important video. | — |
| 2 | 12 | For educators and creators who need a careful caption check before publishing. | — |
| 3 | 9 | Opens a short sample review with two caption cues. | Terminology: F-1-23 |
| 4 | 4 | Caption tools make words. | — |
| 5 | 9 | This check keeps those words from hiding the image. | — |
| 6 | 10 | Drop in the video and its SRT or WebVTT file. | — |
| 7 | 5 | The checker processes them locally. | Listed claim |
| 8 | 15 | The checker seeks into each timed cue and looks for face or dense visual overlap. | Jargon: F-1-22 |
| 9 | 14 | Review exact timecodes, compare a safer position, mark protected regions, and export the list. | Terminology: F-1-23 |
| 10 | 9 | A warning you can inspect—not a magic score. | Terminology: F-1-23 |
| 11 | 17 | The review shows which region triggered an alert, the cue’s exact time, and a suggested alternate zone. | Terminology: F-1-23 |
| 12 | 15 | Add your own protected area for an interpreter or sign the automated pass may miss. | Inconsistent term: F-1-23 |
| 13 | 7 | See the installed app in four frames. | — |
| 14 | 18 | Load the included lesson sample on first run, then inspect the cue list and export the free CSV. | Terminology: F-1-23 |
| 15 | 6 | Start with a complete local project. | — |
| 16 | 5 | Frames stay on your device. | Listed claim |
| 17 | 7 | See the time, region, and next move. | — |
| 18 | 7 | Send the free CSV to an editor. | Listed claim |
| 19 | 9 | Install the small desktop app for dependable offline reviews. | F-1-6, F-1-22 |
| 20 | 17 | Builds are unsigned while the project is new; your platform may ask you to confirm opening it. | F-1-14 |
| 21 | 5 | The complete check stays free. | Ambiguous and contradicted: F-1-3 |
| 22 | 11 | Studio is for teams and creators who keep structured project reports. | Contradicted: F-1-3 |
| 23 | 2 | Hosted checkout. | False on live site: F-1-1 |
| 24 | 6 | Sociobot/Dodo is the merchant of record. | Untested and attached to dead checkout: F-1-1 |
| 25 | 9 | Built for a better review, not a compliance badge. | — |
| 26 | 3 | Detection is advisory. | Terminology: F-1-23 |
| 27 | 7 | Watch the final export with captions enabled. | — |
| 28 | 9 | Include people who use captions in review when possible. | — |
| 29 | 6 | Check your publishing platform’s caption rendering. | — |
| 30 | 4 | Original generated environmental artwork. | F-1-15 |
| 31 | 2 | No tracking. | Test gap: F-1-16 |
| 32 | 5 | Checks media on your device. | Listed claim |

No landing sentence exceeds 22 words and no banned plain-words term appears.

### README sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 16 | Caption Placement Check is a local-first accessibility preflight for solo educators, creators, and small publishing teams. | Jargon: F-1-22 |
| 2 | 32 | Pair a final video with SRT or WebVTT captions; the app samples each timed cue, flags overlap with faces and visually dense regions, recommends an alternate zone, and produces a review list. | Over 22: F-1-19; terminology: F-1-23 |
| 3 | 10 | It is intentionally not a transcription tool or compliance certificate. | — |
| 4 | 7 | A human should watch the final export. | — |
| 5 | 7 | Live site and browser checker: https://caption-placement-check.sociobot.in | — |
| 6 | 10 | Try the isolated sample review in one click: https://caption-placement-check.sociobot.in/demo/. | F-1-2 |
| 7 | 13 | It loads a shipped two-cue lesson sample and does not save demo data. | F-1-2 |
| 8 | 9 | Processes video and caption files in local app memory. | Listed claim |
| 9 | 11 | Parses SRT and WebVTT, including cue position settings and non-Latin text. | F-1-5 |
| 10 | 17 | Uses an available platform face detector, a conservative local fallback, and a visual-density heuristic as advisory signals. | Jargon: F-1-22 |
| 11 | 14 | Lets a reviewer draw protected regions for interpreters, slides, signs, or other meaningful content. | Listed claim |
| 12 | 8 | Exports the review list as CSV for free. | Listed claim |
| 13 | 9 | Saves protected-region presets in the browser when you choose. | Listed claim |
| 14 | 10 | Studio exports JSON project reports for a $19 one-time license. | Contradicted by Terms: F-1-3 |
| 15 | 16 | Requirements: Node.js 22+, npm, and—for the desktop shell—Rust plus the Tauri 2 system dependencies. | — |
| 16 | 9 | The release workflow is the source of platform binaries. | Test gap: F-1-17 |
| 17 | 21 | Tag v* or dispatch .github/workflows/release.yml; GitHub Actions builds macOS arm64/x64, Windows x64, and Linux x64 bundles and publishes SHA256SUMS plus latest.json. | Test gap: F-1-17 |
| 18 | 20 | The landing page reads release metadata from the CORS-enabled GitHub Releases API and caches a successful result for one hour. | F-1-7, F-1-22 |
| 19 | 23 | If GitHub has no release or cannot be reached, it calmly links to the Releases page instead of failing in the browser console. | Over 22: F-1-20; unlisted: F-1-8 |
| 20 | 18 | The landing page detects the operating system and only selects a matching architecture when the browser provides one. | F-1-9 |
| 21 | 6 | Otherwise it opens the release choices. | F-1-9 |
| 22 | 11 | Terminal installers download and verify SHA-256 before opening/installing a matching asset. | F-1-10 |
| 23 | 5 | Early desktop builds are unsigned. | F-1-14 |
| 24 | 8 | On macOS, right-click the app and choose Open. | — |
| 25 | 8 | On Windows, review the SmartScreen prompt before continuing. | — |
| 26 | 14 | The app has no telemetry or advertising analytics and uses no runtime CDN resources. | Test gap: F-1-16 |
| 27 | 5 | Chosen media is processed locally. | Listed claim |
| 28 | 16 | Saved protected regions stay in browser storage until you clear site data; demo mode saves nothing. | Demo failure: F-1-2 |
| 29 | 4 | See site/privacy/index.html and site/terms/index.html. | — |
| 30 | 12 | The scanner, recommendations, manual regions, saved regions, and CSV export are free. | Listed across multiple claims |
| 31 | 10 | Studio is a $19 one-time license for JSON project reports. | Contradicted by Terms: F-1-3 |
| 32 | 6 | Checkout and license verification use Sociobot/Dodo. | Checkout failure: F-1-1 |
| 33 | 23 | A license token is stored only in browser storage and checked at most once daily; the free checker never waits for that check. | Over 22 and unlisted: F-1-11, F-1-21 |
| 34 | 13 | Use Restore a license in the checker to move Studio to another device. | F-1-12 |
| 35 | 12 | Run npm run test:benchmark for the labelled 30-video placement regression corpus. | Jargon: F-1-22 |
| 36 | 22 | It decodes each shipped ten-minute WebM fixture through the browser scanner and guards the brief threshold without making a public accuracy promise. | F-1-13 |
| 37 | 2 | See .factory/benchmark.md. | — |
| 38 | 11 | The visual rationale, asset prompt, and provenance are documented in .factory/design.md. | — |
| 39 | 5 | The software is MIT licensed. | F-1-18 |

### Headings and actions

The flagged headings are recorded in F-1-24. Other headings state their topic
without context. The landing actions are result-naming verbs:

- **Try it with sample data** — pass.
- **Check your own files** — pass.
- **Download for Linux x64** (live dynamic label) — pass.
- **Copy command** — pass.
- **Buy Studio** — wording passes, destination fails under F-1-1.

The header’s **Download** is an in-page navigation link, not a submit-style
button.

## 4. Demo and sandbox result

The one-click demo meets the visible-use requirement:

- `/demo/` loaded directly and via the first-screen action.
- The first populated screen showed “2 cues sampled · 2 cues need a closer
  look,” two finding cards, and two “Move this cue to top center”
  recommendations.
- The persistent banner included **Reset demo** and **Start for real**.
- Adding a keyboard protected region and choosing **Save protected regions**
  produced “Demo changes are kept only for this sample review.”
- Reset restored the two-cue sample and left the protected-region sentinel
  unchanged.
- A clean live demo reloaded offline with the title, banner, and two findings.

It still fails because of the real-license read and verification request in
F-1-2.

## 5. Claims results

Each exact command from `.factory/claims.json` was run separately from the
clean base after `npm ci`.

| Claim | Exact isolated result |
| --- | --- |
| `sample-demo` | PASS |
| `media-local` | PASS |
| `no-account` | PASS |
| `saved-regions-local` | PASS |
| `no-tracking` | PASS |
| `offline-demo` | PASS |
| `local-scan` | PASS |
| `caption-formats` | PASS |
| `local-detection` | PASS |
| `safe-zone-recommendations` | PASS |
| `manual-regions` | PASS |
| `json-project-report` | PASS |
| `desktop-downloads` | PASS |

The complete suite produced one `local-detection` failure before passing on a
second run. That remains blocking under F-1-4. F-1-5 through F-1-18 record
unlisted or incompletely tested claim text, so the product also fails the “no
untested claim” requirement.

## 6. Earlier history

No earlier `.factory/review-*.md` or `.factory/polish-*.md` files exist. The
earlier `.factory/handoff.md` identified two repaired blockers:

1. **Offline demo cache:** confirmed fixed in code and live. `public/sw.js`
   uses cache `caption-placement-check-v8` and removes stale encoding/length
   headers. A clean live online-to-offline reload retained the demo title,
   banner, and two findings.
2. **Desktop artifact provenance:** confirmed fixed. GitHub release `v0.1.3`
   targets `e55a2034228ce7792a5bf063d3b8b169368256ef` and publishes macOS,
   Windows, and Linux artifacts plus `SHA256SUMS` and `latest.json`.

Neither prior blocker is repeated. The new findings exercise cases not covered
by that handoff.

## 7. Structure, accessibility, links, and identity

Confirmed:

- `/`, `/demo/`, `/check/`, `/privacy/`, and `/terms/` return 200; an unknown
  deep link returns the designed 404 with status 404 and a route back home.
- Every tested route has `lang="en"`, one `h1`, one `main`, a route-specific
  title, description, canonical URL, Open Graph data, and a 1200 × 630 original
  social image, subject to F-1-27 and F-1-29.
- Internal links and GitHub source/release/download links resolved. The only
  dead crawled action is checkout (F-1-1).
- Back returns to the correct URL; focus restoration fails under F-1-26.
- Live axe scans reported zero violations on all six routes at 390 × 844 and
  1440 × 900. No horizontal overflow or page console errors appeared on normal
  loads.
- Response headers include HSTS, CSP, `nosniff`, referrer policy, and a
  restrictive permissions policy.
- The landing bundle is 1.85 KB gzip JavaScript and 5.79 KB gzip CSS.
- The projection-room palette, frame marks, generated hero, cue-sheet type,
  and scan-line grammar are product-specific. It does not read as a generic
  SaaS template.

## 8. Missed leverage and AI

No finding. The brief calls for local video/caption import, a review list, safe
positions, and export; those paths exist. CSV export is free and JSON export is
the paid option. A generative AI step would add network/privacy cost without an
obvious user need, so its absence is appropriate. No embedded provider key or
decorative AI feature was found.

## 9. Verification summary

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 58 packages, 0 vulnerabilities |
| 13 exact claim commands | PASS individually |
| `npm test` | PASS; 12/12 |
| `npm run build` | PASS; `dist/site/` produced |
| First `npm run test:e2e` | **FAIL**; `local-detection` returned 0 findings |
| `local-detection --repeat-each=5` | PASS; 5/5 |
| Second `npm run test:e2e` | PASS; 21/21 |
| `npm run test:benchmark` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run check` | Environment-blocked at Rust: system `glib-2.0` missing; TypeScript passed |
| Live axe, six routes × two widths | PASS; zero violations |
| Live offline demo | PASS after waiting for both findings |
| Live link crawl | FAIL only at Studio checkout |

The Rust failure is not counted as a product finding because README documents
the required Tauri system packages and this disposable image does not contain
them.

## What would make this perfect

Resolve all 29 findings, then rerun the review from a fresh context. In
particular: make checkout real, prevent every real-storage read in demo mode,
align Terms with the $19 boundary, make detection deterministic, inventory and
test every public claim, simplify the flagged copy, and apply one complete
header/footer/metadata/focus contract to every route. Perfect means both full
E2E runs pass consecutively and a seeded-real-data demo produces only
same-origin sample requests.
