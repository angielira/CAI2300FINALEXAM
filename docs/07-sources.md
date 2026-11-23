# 07 · Sources and verification status

| Source | Used for | Status in the build session (2026-11-22) |
|---|---|---|
| https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB | 03, IndexedDB expert | Fetched and summarised |
| https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | 03 | Fetched and summarised |
| https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static | 02, 04 | Fetched and summarised |
| https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers | 02 | Fetched and summarised |
| https://docs.netlify.com/manage/routing/headers/ | 04 | Fetched and summarised |
| https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html and sub-pages | 01, OpenCV expert | **Not fetched** (approval needed). Written from the official tutorials as known; every function was cross-checked by running the pipeline in OpenCV 5.0 for Python (`tests/pipeline_check.py`). |
| https://webassembly.org/ | 02 | **Not fetched** (approval needed). Summarised from the official page as known. |
| https://developer.chrome.com/docs/devtools/storage/indexeddb | 05 | **Not fetched** (approval needed). Steps match Chrome's Application panel. |
| https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/skills | agents and skills | **Not fetched** (approval needed). Format follows the documented frontmatter (`name`, `description`, `tools`, `model`, `skills`). |
| https://developer.apple.com/design/human-interface-guidelines/ | designers | **Not fetched**. Principles summarised as known. |

To refresh any "not fetched" note: open the link, compare, and update the note in `docs/` and in `knowledge/<agent>/docs/`.
