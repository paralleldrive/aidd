# aidd-layout

Enforces a strict separation between terminal components (which render UI) and
layout components (which compose children and manage spacing).

## Why

Layout components free of business logic rarely re-render. State changes
trigger updates at the terminal level while the layout structure stays stable,
keeping the component tree efficient by default.

## Usage

Invoke `/aidd-layout` when designing layouts or creating UI components. Every
component is either terminal or layout — no overlap. Terminal components own
their UI and CSS but never have external margin. Layout components render no UI
themselves and are responsible only for interior gaps between children.

## When to use

- Designing layouts or creating UI components
- Working with spacing, gaps, or component hierarchy
- Deciding whether a component should be terminal or layout
