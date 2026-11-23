# Liquid-glass materials on the web

Sources: Apple HIG Materials: https://developer.apple.com/design/human-interface-guidelines/materials (not fetched in the build session) · MDN backdrop-filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

- Translucent layers that blur and tint what is behind them, giving depth without heavy shadows.
- CSS: `background: rgba(255,255,255,.62); backdrop-filter: blur(28px) saturate(170%); border: 1px solid rgba(255,255,255,.7); border-radius: 22px;` plus a soft two-layer shadow.
- Glass needs something colourful behind it: three large blurred blobs (salsa red, gold, magenta) fixed behind the page.
- Dark mode: darker, warmer tint (`rgba(40,22,30,.55)`), lower blob opacity, borders at 12 % white.
- Keep text contrast AA on glass: the tint must be strong enough; test light, dark and narrow screenshots.
