# aidd-layout — UI Component Layout Reference

`/aidd-layout` enforces a strict separation between terminal components (which
render UI) and layout components (which compose children and manage spacing).

## Why this split matters

Layout components that contain no business logic rarely re-render. State changes
and user interactions trigger updates at the terminal level while the layout
structure above stays stable. This keeps the component tree efficient by default.

## Terminal components

- Render their own UI (buttons, inputs, cards, text)
- Own their CSS for appearance
- **Never** have external margin

Terminal components are the leaves of the component tree — they own visual
styling and content.

## Layout components

- Do **not** render any UI themselves
- Composed of other layout or terminal components only
- Responsible for **interior gaps** between children
- **Never** have external margin
- Should not need custom CSS 90%+ of the time — use standard layout tokens
  (see [design-tokens](references/design-tokens.md))

**Exception**: some layout components explicitly manage state (tabs, accordions,
animations) — those may contain logic and re-render.

## Rules

1. Every component is either terminal or layout — no overlap
2. Terminal: owns UI and CSS, never external margin
3. Layout: no own UI, only layout/terminal children, owns interior gaps, never
   external margin
4. Prefer standard layout tokens over custom CSS in layout components
5. Keep layout components free of business logic unless they manage layout state

## When to use `/aidd-layout`

- Designing layouts or creating UI components
- Working with spacing, gaps, or component hierarchy
- Deciding whether a component should be terminal or layout
