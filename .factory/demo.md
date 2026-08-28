# Demo sandbox

Open `/demo/` or choose **Try it with sample data** on the landing page.

The demo loads `public/demo/sample.webm` and `public/demo/sample.srt`: a two-cue lesson excerpt. It immediately scans the pair and shows the normal review bench. The persistent banner says **Demo — sample data, nothing is saved**. **Reset demo** reloads the shipped pair; **Start for real** opens `/check/`.

Demo mode never reads or writes the real license or Studio preset keys. It has no persistent storage namespace because it stores no data at all; the sample files are fetched from the same origin and are precached by the service worker for the offline demonstration.
