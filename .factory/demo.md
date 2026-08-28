# Demo sandbox

Open <https://caption-placement-check.sociobot.in/?demo=1> or choose **Try it with sample data** on the first screen. The URL redirects to the real `/demo/?demo=1` route.

The installed desktop app exposes the same shipped pair through **Load sample project** on its first screen.

The demo loads `public/demo/sample.webm` and `public/demo/sample.srt`. The captions contain Arabic and Japanese text. The populated review shows two alerts and a safer position for each.

The persistent banner says **Demo — sample data, nothing is saved**. **Reset demo** discards in-memory edits and reloads the shipped pair. **Start for real** opens `/check/` without copying demo changes.

Demo mode has no persistent application-data namespace because it writes no application data. It never reads license, verdict, protected-region, or release-cache keys. The same-origin service worker caches the public shell and sample files only for offline loading.
