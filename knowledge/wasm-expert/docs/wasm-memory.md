# WebAssembly memory and leaks

Sources: https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Memory · OpenCV.js basic operations tutorial (docs.opencv.org; not fetched in the build session)

- A module's linear memory is one resizable `ArrayBuffer` (`WebAssembly.Memory`). It can grow, never shrink.
- C++ objects (a `cv::Mat`'s pixel buffer) live inside it. The JS wrapper is tiny; the garbage collector does not know about the pixels. Only `.delete()` frees them.
- Symptom of a leak: each analysis adds ~W×H×4 bytes; the tab slows, then throws "Cannot enlarge memory" / out-of-memory.
- When memory grows, old typed-array views (`mat.data`) are detached: copy data out immediately.
- Our guarantee: tracker + `finally`, and every result reports `matsAlive` (must be 0). Photos are capped at 800 px on the long side.
