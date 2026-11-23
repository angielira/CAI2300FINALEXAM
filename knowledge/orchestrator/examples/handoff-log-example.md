# Example hand-off log rows

| # | From → To | What | Why | Outcome |
|---|---|---|---|---|
| 1 | Atlas → Iris | Build the silhouette pipeline | Wave 1, no dependencies | Done; Python twin PASS |
| 2 | Iris → Atlas → Forge | pipeline.js for the worker | Forge needs the API | Forge found `contours.get(i)` untracked → returned to Iris |
| 3 | Forge → Atlas → Iris | Leak fix request | review rejection | Fixed; matsAlive = 0 |
