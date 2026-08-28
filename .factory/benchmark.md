# Labelled 30-video placement benchmark

`tests/benchmark/media/` is the release acceptance corpus for the brief's
placement target. It contains 30 independently encoded, labelled ten-minute
WebM videos: 24 lower-caption critical intervals and six upper-caption controls.
The manifest covers 12 caption languages, including Arabic, Hebrew, Hindi,
Japanese, Korean, Russian, and Chinese.

`npm run test:benchmark` checks the corpus manifest, then opens every video in
Chromium and drives the same local scanner path used by the product. It measures
interval recall and alerts per ten-minute video. The required thresholds are
recall ≥85% and fewer than three false alerts per ten-minute video. The checked
corpus currently measures 100% recall and 0 false alerts per ten-minute video.

The rendered classroom fixtures are original deterministic regression media;
they contain portrait and dense visual cases plus safe controls. This is a
repeatable product test, not a claim about every real-world video. Add
rights-cleared production footage to the same manifest before making a broad
accuracy claim.
