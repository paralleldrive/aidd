---
name: layout
description: Enforces UI component layout and composition patterns. Use when designing layouts, creating UI components, spacing, gaps, or when the user asks about component hierarchy, terminal vs layout components, or re-render efficiency.
---

# Layout and component types

UI components are one of two types with no overlap. Every component is either terminal or layout.

---

## Terminal components

- Render their own UI (buttons, inputs, cards, text, etc.)
- Contain CSS for their appearance
- **Never** contain any external margin

Terminal components are the leaves of the component tree. They own their visual styling and content.

---

## Layout components

- Do **not** render any UI themselves
- Composed only of other layout or terminal components
- Responsible for interior gaps between their children
- **Never** contain any external margin
- Should not need CSS 90% of the time or more — use the standard layout tokens. See [design-tokens](design-tokens.md).
- Generally have no business logic and should never re-render — keeps re-renders confined to lower terminal levels

**Exception:** Some layout components explicitly manage state (animating, showing/hiding tabs, accordions). Those will have logic and may re-render.

---

## Why this split matters

Layout components that rarely re-render are efficient. State changes and user interactions trigger updates at terminal levels; layout structure above stays stable. Avoid putting reactive logic in layout components unless the layout itself is dynamic (tabs, accordions, animations).

---

## Execute

When creating or modifying UI components:
1. Classify as terminal or layout. No overlap.
2. Terminal: owns UI and CSS; never external margin.
3. Layout: no own UI; only layout/terminal children; owns interior gaps; never external margin.
4. Prefer standard layout tokens for layout components; avoid custom CSS when possible. See [design-tokens](design-tokens.md).
5. Keep layout components free of business logic unless they explicitly manage layout state (tabs, accordions, animations).
