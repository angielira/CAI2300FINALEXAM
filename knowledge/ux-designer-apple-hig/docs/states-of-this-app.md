# Every state the dancer can see

| Area | State | What they see | Way out |
|---|---|---|---|
| Status pill | Loading OpenCV… | pulsing amber dot | wait (2-min timeout) |
| | Ready · OpenCV x | green dot | — |
| | Working… | amber dot + spinner over the photo | auto-restart at 30 s |
| | Done in N ms | green | — |
| | OpenCV error | red dot + banner | Try again |
| Result | empty | "Your outlined shape appears here." | open a photo |
| | no dancer found | explanation | manual threshold / GrabCut / plainer wall |
| | outline only (no reference) | outline + measures + "Save reference" | name it |
| | scored | ring, coach tip, measures, ghost outline | run again / save |
| Library | Opening library… | text | blocked banner if another tab holds an old version |
| | empty refs / empty history | one-line guidance | — |
| Camera | permission denied | banner | upload instead |
