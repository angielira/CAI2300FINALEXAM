# Example: a good delegation message (Atlas → Forge)

> **Forge**, Iris has finished `js/pipeline.js` (attached summary below). Your task: write `shape.worker.js` that loads opencv.js once with `importScripts` (official URLs: 4.13.0 then 4.x), waits for `cv.Mat`, converts the incoming ImageBitmap to ImageData with an OffscreenCanvas capped at 800 px, calls `SalsaPipeline.analyzeShape`, and transfers `pixels.buffer` and `points.buffer` back. It must always reply (`result` or `error`). Also review Iris's pipeline: every allocation tracked? `matsAlive` must be 0.
> **Inputs:** `docs/02-webassembly-and-workers.md`, `js/pipeline.js`. **Output:** the file + your review notes. **Done when:** Vera's flow test passes and your review lists no untracked allocations.

Why it is good: names the inputs, the exact output, the definition of done, and the review duty.
