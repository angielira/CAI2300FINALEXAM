# Camera capture

Source: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

- `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` returns a `MediaStream`; requires a secure context (HTTPS or localhost) and user permission. Rejects with `NotAllowedError` / `NotFoundError`.
- Show it in `<video playsinline muted>` (`video.srcObject = stream; await video.play()`).
- Capture: draw the video to a canvas (`ctx.drawImage(video, 0, 0)`), then `canvas.toBlob`. We mirror the preview and the capture so the dancer sees themselves as in a mirror.
- Stop every track when done: `stream.getTracks().forEach(t => t.stop())` (turns the camera light off).
- Dancers need a self-timer (3/5/10 s) to get into position.
