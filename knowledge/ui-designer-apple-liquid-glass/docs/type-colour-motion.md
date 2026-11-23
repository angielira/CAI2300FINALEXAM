# Type, colour and motion

- System font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, Roboto…`; tight letter-spacing on headings (-0.02em); tabular numbers for scores and timings.
- One accent: salsa red `#ff4655`; semantic colours: green `#34c759` ok, amber `#ff9f0a` warn, red `#ff3b30` error (Apple system colours).
- Shapes: pills for buttons and status, 22 px cards, 12 px inputs.
- Motion: short (0.1–0.2 s) and purposeful; disabled under `prefers-reduced-motion`.
- Bug learned the hard way: a `display: grid/flex` rule overrides the `hidden` attribute. Always add `[hidden] { display: none !important; }`.
