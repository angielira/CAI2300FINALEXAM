# Example outputs (recorded 2026-11-22, OpenCV 5.0 Python)

```
$ python3 knowledge/opencv-expert/examples/silhouette_score.py
dip-attempt.jpg          area=   37655 aspect=1.47 solidity=0.37 points=81
dip-reference.jpg        area=   50931 aspect=1.49 solidity=0.40 points=81
styling-attempt.jpg      area=   23406 aspect=2.38 solidity=0.29 points=54
styling-reference.jpg    area=   33116 aspect=2.49 solidity=0.29 points=62

dip-attempt.jpg          vs dip-reference.jpg        matchShapes=0.633 score= 93%  SAME shape
dip-attempt.jpg          vs styling-attempt.jpg      matchShapes=2.570 score= 27%  different
dip-attempt.jpg          vs styling-reference.jpg    matchShapes=2.757 score= 25%  different
dip-reference.jpg        vs styling-attempt.jpg      matchShapes=2.733 score= 24%  different
dip-reference.jpg        vs styling-reference.jpg    matchShapes=2.810 score= 23%  different
styling-attempt.jpg      vs styling-reference.jpg    matchShapes=1.049 score= 82%  SAME shape

RESULT: PASS

$ python3 knowledge/opencv-expert/examples/hu_moments_invariance.py
star vs scaled 0.6 and moved   matchShapes I2 = 0.0044
star vs rotated 35 deg         matchShapes I2 = 0.0538
star vs a different shape      matchShapes I2 = 2.1383
Hu moments of the star (log10|h|): [-0.67, -3.33, -5.86, -4.62, -9.86, -6.28, -10.89]
```

`silhouette-score.js` needs a loaded OpenCV.js; its full, tested form is `js/pipeline.js`.
