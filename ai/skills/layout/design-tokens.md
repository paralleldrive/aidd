# Layout design tokens

Standard CSS classes for layout components. Use these instead of custom CSS in most cases. See [SKILL.md](SKILL.md) for terminal vs layout component rules.

Most applications should define these tokens in a `common.css` file and make it available globally according to the UI tech stack. In Lit, import the styles and include them in the `export const styles` property of the root element or shared base class.

---

```css
/* -- Direction --------------------------------------------------------- */
/* Vertical flex column. Default gap: related-item spacing. */
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--firefly-studio-gap);
}

/* Horizontal flex row. Default gap: related-item spacing. */
.row {
  display: flex;
  flex-direction: row;
  gap: var(--firefly-studio-gap);
}

/* Wrapping horizontal flex row. Default gap: related-item spacing. */
.cluster {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--firefly-studio-gap);
}

/* -- Gap overrides ----------------------------------------------------- */

/* Widen gap to section-level spacing. */
.gap-gutter {
  gap: var(--firefly-studio-gutter);
}

/* Widen gap to container-inset spacing. */
.gap-padding {
  gap: var(--firefly-studio-padding);
}

/* Remove gap entirely. */
.gap-none {
  gap: 0;
}

/* -- Inset (padding) --------------------------------------------------- */

/* Pad with container-inset spacing (outermost content areas). */
.inset {
  padding: var(--firefly-studio-padding);
}

/* Pad with section-level spacing. */
.inset-gutter {
  padding: var(--firefly-studio-gutter);
}

/* Pad with related-item spacing (tight interior padding). */
.inset-gap {
  padding: var(--firefly-studio-gap);
}

/* -- Alignment --------------------------------------------------------- */

/* Center children on both axes. */
.center {
  justify-content: center;
  align-items: center;
}

/* Push children to opposite ends of the main axis. */
.spread {
  justify-content: space-between;
}

/* Center children on the cross axis. */
.align-center {
  align-items: center;
}

/* Align children to the start of the cross axis. */
.align-start {
  align-items: flex-start;
}

/* Align children to the end of the cross axis. */
.align-end {
  align-items: flex-end;
}

/* -- Sizing (applied to children) -------------------------------------- */

/* Grow to fill available space. */
.fill {
  flex: 1;
}

/* Stay at intrinsic size; don't grow or shrink. */
.fit {
  flex: 0 0 auto;
}
```
