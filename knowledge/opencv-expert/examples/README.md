# Example outputs (recorded 2026-11-23, OpenCV 5.0 Python, 16 ballet poses)

```
$ python3 knowledge/opencv-expert/examples/silhouette_score.py
32/32 sample photos: silhouette found

pose                  own  overlap matchShapes   runner-up
a-la-seconde          78%     0.72       1.148   attitude-devant     44%  PASS
arabesque             75%     0.69       0.346   penche              38%  PASS
attitude              86%     0.77       0.474   reverence           46%  PASS
attitude-devant       77%     0.72       0.439   developpe-devant    45%  PASS
developpe-devant      82%     0.74       7.630   tendu-seconde       41%  PASS
ecarte                83%     0.76       0.229   attitude-devant     61%  PASS
fifth-en-haut         92%     0.84       8.783   first-bras-bas      64%  PASS
first-bras-bas        84%     0.77       0.297   fifth-en-haut       63%  PASS
fourth-croise         76%     0.75       1.024   fifth-en-haut       39%  PASS
grand-jete            66%     0.59       8.152   penche              18%  PASS
penche                78%     0.75       0.391   a-la-seconde        38%  PASS
retire                93%     0.86       1.073   fifth-en-haut       56%  PASS
reverence             69%     0.68       0.794   ecarte              33%  PASS
second-plie           80%     0.73       0.603   attitude            35%  PASS
tendu-devant          78%     0.76       0.548   tendu-seconde       59%  PASS
tendu-seconde         76%     0.69       8.916   tendu-devant        57%  PASS

RESULT: PASS

$ python3 knowledge/opencv-expert/examples/hu_moments_invariance.py
star vs scaled 0.6 and moved   matchShapes I2 = 0.0044
star vs rotated 35 deg         matchShapes I2 = 0.0538
star vs a different shape      matchShapes I2 = 2.1383
Hu moments of the star (log10|h|): [-0.67, -3.33, -5.86, -4.62, -9.86, -6.28, -10.89]
```

The matchShapes column shows 7.6–8.9 for the *same* pose on several ballet poses: Hu moments 5–7 flip sign on thin limbs. That is why the score uses aligned overlap. `silhouette-score.js` shows the Mat bookkeeping; its full, tested form is `js/pipeline.js`.
