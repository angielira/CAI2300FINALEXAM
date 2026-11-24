# Example outputs (recorded 2026-11-23, OpenCV 5.0 Python)

```
$ python3 knowledge/opencv-expert/examples/silhouette_score.py
styling-frame-up-attempt.jpg       area=   24088 aspect=2.48 solidity=0.37 points=46
styling-frame-up-reference.jpg     area=   32602 aspect=2.48 solidity=0.36 points=49
styling-high-arm-attempt.jpg       area=   23906 aspect=2.46 solidity=0.31 points=57
styling-high-arm-reference.jpg     area=   33128 aspect=2.49 solidity=0.29 points=60
styling-hip-hand-attempt.jpg       area=   24942 aspect=2.13 solidity=0.41 points=59
styling-hip-hand-reference.jpg     area=   34583 aspect=2.13 solidity=0.43 points=57
styling-lean-sweep-attempt.jpg     area=   23966 aspect=1.15 solidity=0.29 points=62
styling-lean-sweep-reference.jpg   area=   33428 aspect=1.21 solidity=0.28 points=56

styling-frame-up-attempt.jpg       vs styling-frame-up-reference.jpg     overlap=0.83 matchShapes= 1.107 score= 92%  SAME pose
styling-frame-up-attempt.jpg       vs styling-high-arm-attempt.jpg       overlap=0.38 matchShapes= 8.448 score= 40%  different
styling-frame-up-attempt.jpg       vs styling-high-arm-reference.jpg     overlap=0.41 matchShapes= 9.003 score= 43%  different
styling-frame-up-attempt.jpg       vs styling-hip-hand-attempt.jpg       overlap=0.41 matchShapes= 9.700 score= 36%  different
styling-frame-up-attempt.jpg       vs styling-hip-hand-reference.jpg     overlap=0.42 matchShapes= 2.614 score= 36%  different
styling-frame-up-attempt.jpg       vs styling-lean-sweep-attempt.jpg     overlap=0.27 matchShapes= 8.432 score= 14%  different
styling-frame-up-attempt.jpg       vs styling-lean-sweep-reference.jpg   overlap=0.27 matchShapes= 2.526 score= 14%  different
styling-frame-up-reference.jpg     vs styling-high-arm-attempt.jpg       overlap=0.35 matchShapes= 9.555 score= 37%  different
styling-frame-up-reference.jpg     vs styling-high-arm-reference.jpg     overlap=0.38 matchShapes=10.109 score= 39%  different
styling-frame-up-reference.jpg     vs styling-hip-hand-attempt.jpg       overlap=0.43 matchShapes=10.806 score= 38%  different
styling-frame-up-reference.jpg     vs styling-hip-hand-reference.jpg     overlap=0.43 matchShapes= 3.721 score= 36%  different
styling-frame-up-reference.jpg     vs styling-lean-sweep-attempt.jpg     overlap=0.28 matchShapes= 9.538 score= 14%  different
styling-frame-up-reference.jpg     vs styling-lean-sweep-reference.jpg   overlap=0.28 matchShapes= 3.632 score= 14%  different
styling-high-arm-attempt.jpg       vs styling-high-arm-reference.jpg     overlap=0.76 matchShapes= 0.854 score= 83%  SAME pose
styling-high-arm-attempt.jpg       vs styling-hip-hand-attempt.jpg       overlap=0.47 matchShapes= 1.948 score= 39%  different
styling-high-arm-attempt.jpg       vs styling-hip-hand-reference.jpg     overlap=0.44 matchShapes= 7.008 score= 35%  different
styling-high-arm-attempt.jpg       vs styling-lean-sweep-attempt.jpg     overlap=0.30 matchShapes= 0.319 score= 17%  different
styling-high-arm-attempt.jpg       vs styling-lean-sweep-reference.jpg   overlap=0.33 matchShapes= 7.017 score= 17%  different
styling-high-arm-reference.jpg     vs styling-hip-hand-attempt.jpg       overlap=0.47 matchShapes= 1.521 score= 38%  different
styling-high-arm-reference.jpg     vs styling-hip-hand-reference.jpg     overlap=0.48 matchShapes= 7.358 score= 38%  different
styling-high-arm-reference.jpg     vs styling-lean-sweep-attempt.jpg     overlap=0.31 matchShapes= 1.158 score= 18%  different
styling-high-arm-reference.jpg     vs styling-lean-sweep-reference.jpg   overlap=0.33 matchShapes= 7.831 score= 17%  different
styling-hip-hand-attempt.jpg       vs styling-hip-hand-reference.jpg     overlap=0.76 matchShapes= 8.047 score= 84%  SAME pose
styling-hip-hand-attempt.jpg       vs styling-lean-sweep-attempt.jpg     overlap=0.36 matchShapes= 2.240 score= 15%  different
styling-hip-hand-attempt.jpg       vs styling-lean-sweep-reference.jpg   overlap=0.41 matchShapes= 8.816 score= 20%  different
styling-hip-hand-reference.jpg     vs styling-lean-sweep-attempt.jpg     overlap=0.30 matchShapes= 7.152 score= 13%  different
styling-hip-hand-reference.jpg     vs styling-lean-sweep-reference.jpg   overlap=0.36 matchShapes= 0.898 score= 13%  different
styling-lean-sweep-attempt.jpg     vs styling-lean-sweep-reference.jpg   overlap=0.71 matchShapes= 6.929 score= 75%  SAME pose

RESULT: PASS

$ python3 knowledge/opencv-expert/examples/hu_moments_invariance.py
star vs scaled 0.6 and moved   matchShapes I2 = 0.0044
star vs rotated 35 deg         matchShapes I2 = 0.0538
star vs a different shape      matchShapes I2 = 2.1383
Hu moments of the star (log10|h|): [-0.67, -3.33, -5.86, -4.62, -9.86, -6.28, -10.89]
```

Note how matchShapes gives 8.05 for the *same* hand-on-hip pose but 0.32 for two *different* poses: Hu moments 5–7 flip sign on thin limbs. That is why the score uses aligned overlap. `silhouette-score.js` shows the Mat bookkeeping; its full, tested form is `js/pipeline.js`.
