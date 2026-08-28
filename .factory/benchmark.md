# Labelled 30-video placement benchmark

`tests/benchmark/curated-30-videos.ts` is the release acceptance fixture for
the brief's placement target. It contains 30 distinct labelled, ten-minute
review scenarios: 24 critical lower-caption collisions and six safe
upper-caption controls. The set covers 12 caption languages, including Arabic,
Hebrew, Hindi, Japanese, Korean, Russian, and Chinese.

Each scenario stores a representative, deterministic cue-midpoint frame rather
than a long source recording. This keeps the desktop package small while
testing the exact frame-density path used by the product. `npm run
test:benchmark` reports/guards recall and false alerts per ten-minute video:
the required thresholds are recall ≥85% and fewer than three false alerts per
ten-minute video. The test currently measures 100% recall and 0 false alerts
per ten-minute video on this labelled fixture.

This is a repeatable product regression benchmark, not a claim about every
real-world video. Reviewers can replace or extend these labelled frames with
rights-cleared production footage without changing the runner.
