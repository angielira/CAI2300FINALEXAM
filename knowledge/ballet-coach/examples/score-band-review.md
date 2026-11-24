# Example: do the scores feel right to a dancer? (16 ballet poses, 2026-11-23)

Output of `python3 tests/pipeline_check.py` (own score, overlap, matchShapes, runner-up):

```

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
```

Verdict (Margot):
- Every attempt is recognised as its own pose. Fair look-alikes: first ↔ fifth position, the two tendus, retiré ↔ fifth en haut (same arms), écarté ↔ attitude devant.
- Grand jeté scores lowest against itself (66 %): jumps vary more between attempts. Honest.
- matchShapes alone would fail: développé devant 7.6, fifth en haut 8.8 and tendu à la seconde 8.9 for the *same* pose.
