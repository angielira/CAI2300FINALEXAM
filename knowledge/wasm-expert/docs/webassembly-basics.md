# WebAssembly basics

Sources: https://webassembly.org/ (not fetched in the build session: approval needed) · https://developer.mozilla.org/en-US/docs/WebAssembly

- WebAssembly (Wasm) is a binary instruction format for a stack-based virtual machine, designed as a portable compilation target for languages like C, C++ and Rust.
- Goals stated by the project: **efficient and fast** (near-native speed), **safe** (memory-safe sandbox, same-origin and permission rules of the browser), **open and debuggable** (a text format exists), and **part of the open web platform** (calls to and from JavaScript).
- It does not replace JavaScript: JS handles the DOM, events and UI; Wasm does heavy computation (lecture slide 4: "JavaScript + Wasm, not JavaScript vs. Wasm").
- OpenCV.js = OpenCV C++ compiled with Emscripten to Wasm + JavaScript bindings (Embind) exposing `cv.*`.
- Startup cost is real (download + compile ~10 MB): load once, reuse; cache it (service worker).
