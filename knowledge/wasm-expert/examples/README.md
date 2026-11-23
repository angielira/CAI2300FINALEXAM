# Example outputs (recorded 2026-11-22)

```
$ node knowledge/wasm-expert/examples/mat-tracker.mjs
Mats alive after a good run and a failed run: 0
PASS

$ (serve the repo) open knowledge/wasm-expert/examples/worker-always-replies/page.html in Chrome
worker ready
worker ready          <- second worker, started after the hang
work: ok (8.8 ms)
fail: bad input       <- the worker replied with an error instead of going silent
hang: timed out after 1500 ms; worker restarted
work: ok (5.8 ms)     <- the fresh worker keeps serving
title: PASS
```
