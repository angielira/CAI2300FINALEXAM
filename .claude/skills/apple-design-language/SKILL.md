---
name: apple-design-language
description: Apply Apple-style HIG flow and liquid-glass visuals consistently: hierarchy, states, materials, typography, colour, motion and accessibility.
---

# apple-design-language

Shared by: `ux-designer-apple-hig`, `ui-designer-apple-liquid-glass`, `frontend-engineer`

1. Every screen has one clear primary action; numbered steps (1 shape, 2 compare, 3 result).
2. Every async state is visible: Loading OpenCV, Ready, Working, Done in N ms, Error (with a way out).
3. Materials: translucent glass cards (`backdrop-filter: blur(28px) saturate(170%)`) over a warm blurred backdrop; system font; 22 px radius; one accent (#ff4655).
4. Respect `prefers-color-scheme` and `prefers-reduced-motion`; contrast AA; visible focus rings; every control keyboard-reachable.
5. The `[hidden]` attribute must always win over display rules.
