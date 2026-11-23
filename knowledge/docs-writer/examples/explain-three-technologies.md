# Example: explaining the stack in plain words (from how-it-works.html)

**OpenCV.js (the eyes).** OpenCV is the most widely used computer vision library. OpenCV.js is the same library packaged for the web: one file, and every function waits on an object called `cv`.

**WebAssembly (the muscle).** OpenCV is written in C++. It was compiled to WebAssembly, a compact binary format that runs at close to native speed inside the browser's security sandbox.

**IndexedDB (the memory).** A real database built into your browser. It keeps your reference shapes and every attempt on your own computer, so they are still here after a refresh.
