# Apple HIG principles applied here

Source: https://developer.apple.com/design/human-interface-guidelines/ (not fetched in the build session; summarised as known)

- **Hierarchy:** the most important thing is obvious; content first, controls support it. → Result panel is the largest card; numbered steps 1-2-3.
- **Feedback:** every action gets a timely, visible response; progress is shown for anything slow. → Status pill (Loading OpenCV / Ready / Working / Done in N ms / Error), spinner over the photo.
- **Clarity and plain language:** say what happened and what to do next. → Errors always include a next step or a button.
- **Consistency:** familiar controls (segmented control, switches, sheets). → Threshold Auto/Manual segmented control; toggles; `<dialog>` sheets for camera and viewer.
- **Accessibility:** contrast, Dynamic Type-like scaling, keyboard/VoiceOver labels, reduced motion. → `role="status" aria-live`, labelled controls, focus rings, `prefers-reduced-motion`.
- **Deference:** UI doesn't compete with content. → Glass chrome, the photo carries the colour.
