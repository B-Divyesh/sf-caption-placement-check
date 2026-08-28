# Caption Placement Check — visual thesis

## Direction

**Cinematic environmental art: the projection booth after the audience leaves.** The product is a preflight bench, not another video editor. Its interface borrows the deep charcoal of a screening room, warm paper labels from a continuity log, and a precise projector-orange scan line. Video remains the brightest object. Quiet grain and frame marks suggest inspection without imitating a generic dashboard or film-editing suite.

The landing page opens on an original cinematic still: an empty lecture hall, a projected frame, and a caption safe-zone aperture. It explains the job visually—protect the meaningful subject before publishing—rather than acting as decoration.

## Palette

- `ink #101313`: screening-room background.
- `charcoal #181d1c`: work surfaces.
- `slate #28302e`: raised controls.
- `paper #f4eedf`: primary text and pale daylight surface.
- `mist #c5cbc5`: muted text (7.7:1 on ink).
- `projector #ffb35c`: focus, primary action, timeline playhead; dark text gives 9:1 contrast.
- `signal #80d8b2`: verified/safe.
- `warning #ffd36a`: advisory overlap.
- `danger #ff8178`: definite input errors.
- Light treatment uses `#f2ede2` canvas, `#fffaf0` surface, `#17201e` text, and `#8b4300` accent. The desktop workspace is intentionally dark because video review benefits from visual deference; legal and landing reading surfaces can use the light treatment.

State is never color-only: each status includes an icon/word and, on the frame overlay, a distinct line treatment.

## Type and rhythm

No runtime font downloads. Display and labels use the narrow system stack `Arial Narrow, Avenir Next Condensed, sans-serif`, evoking cue sheets without cosplay. Reading and controls use `Inter, ui-sans-serif, system-ui, sans-serif`; where Inter is absent the platform UI face takes over. Timecodes use `ui-monospace, SFMono-Regular, Menlo, monospace` with tabular figures.

Type scale: 14 label, 16 body, 20 lead, 26 section, 40 workspace title, and clamp(44–76) landing title. Body leading is 1.55 and prose is capped at 68 characters. Spacing follows a strict 4/8px rhythm: 4, 8, 12, 16, 24, 32, 48, 72.

## Interaction grammar

- The path is a three-reel sequence: **Add media → Scan locally → Review cues**.
- Drop zones look like a projected aperture, with corner marks rather than a dashed framework rectangle.
- Findings are cue slips: timecode, evidence, recommendation, and a reviewed toggle. Selecting one seeks the video and reveals its region.
- Overlay regions use a hatched amber fill for advisories; manual protected regions use solid mint corners. The video frame is always primary.
- The free workflow supports full scans and review. A one-time Studio unlock adds reusable protected-region presets and JSON project reports; accessibility findings, safe-zone recommendations, and CSV export remain free.

## Motion policy

Controls respond in 160ms; cue selection uses a 220ms opacity/translate transition from the review list toward the frame. The scanning line traverses only while an explicit scan is running and stops with it. Nothing loops decoratively. Under `prefers-reduced-motion: reduce`, transitions are removed and scan progress is represented by the numeric progress bar only.

## Responsive intent

At desktop widths the frame and cue list share the bench. Below 860px they stack in task order. At 390px, decorative metadata and the landing scene crop are reduced; primary buttons become full-width, the review tabs remain horizontally scrollable, and every action stays at least 44px. Video controls use the browser-native control set for dependable keyboard and touch behavior.

## Asset plan and provenance

- Hero: original 3:2 environmental illustration generated with the factory Azure image deployment on 2026-08-28. Prompt sheet below. Source PNG and prompt JSON live in `assets/src/`; optimized WebP lives in `public/assets/`.
- App mark and interface icons: hand-authored geometric SVG/CSS (frame corners, cue mark, arrows), MIT-covered with this repository.
- No stock assets, third-party logos, real people, or copyrighted characters.

### Hero prompt sheet

Use case: `stylized-concept`. Asset type: landing hero. Primary request: a cinematic environmental illustration of an empty small lecture theatre after a screening, with a luminous projection showing an abstract silhouetted presenter beside a slide and a translucent lower-third caption-safe region that clearly does not cover either subject. World: practical projection booth, worn dark walls, quiet educational venue. Materials: matte plaster, brushed dark metal, faint dust in projector light, paper cue slips. Light/lens: wide 35mm view, low warm projector beam, deep falloff, restrained film grain. Palette words: carbon black, warm parchment, projector amber, muted mint. Composition: landscape, image content weighted to the right with calm negative shadow space on the left; no UI screenshot. Avoid: readable text, letters, watermark, logo, brand, photoreal identifiable people, faces, neon gradient, glossy sci-fi, generic laptop mockup, extra limbs, misleading detection boxes.

