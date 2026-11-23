# Thresholding and morphology for silhouettes

Sources: https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html · OpenCV.js image processing tutorials (linked from https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html). Not fetched in the build session; verified by running in OpenCV 5.0 Python.

- `cv.threshold(src, dst, thresh, maxval, type)`. With `cv.THRESH_BINARY + cv.THRESH_OTSU`, the `thresh` argument is ignored and Otsu's method picks the value that best separates a two-peaked histogram (wall vs dancer). The chosen value is returned.
- `cv.adaptiveThreshold` computes a threshold per neighbourhood: excellent for text on uneven paper, bad for a large uniform dark body (it hollows it out). Not used here.
- Blur first (`cv.GaussianBlur(src, dst, new cv.Size(5,5), 0, 0, cv.BORDER_DEFAULT)`) to reduce noise.
- `cv.morphologyEx(src, dst, cv.MORPH_CLOSE, kernel, new cv.Point(-1,-1), 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue())` fills small holes/gaps; `MORPH_OPEN` removes specks. Kernel: `cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k,k))` (delete it).
- Measured (dip-reference.jpg): Otsu area 50 934 px; manual 120 → 50 662; manual 160 → 95 146 (the floor joins the shape: too high). That is why the slider exists.
