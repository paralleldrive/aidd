# React Skill Epic

**Status**: ✅ COMPLETED
**Completed**: 2026-02-23
**Goal**: Add a `react` skill that guides AI in React component authoring, comparable to the lit skill: binding components, pure presentations, single useObservableValues, action callbacks (verbNoun), and values passed from parent (not Lit properties).

## Summary

Created `ai/skills/react/SKILL.md` with:
- Binding component vs presentation split
- Values from parent (props) — no Lit-style properties; entity passed for multi-instance
- Single useObservableValues, deps array for entity-scoped observation
- Presentation exports (render only), verbNoun callbacks, testing guidance

## Overview

React components need the same separation as Lit: reactive binding (useObservableValues) vs pure presentation. Without guidance, AI may mix hooks into presentation or overuse props. The react skill mirrors the lit skill but with React-specific patterns: pure presentation functions receive values directly from parent as props (no Lit-style properties); entity binding is done by parent passing entity/value to child. Same logic otherwise — single useObservableValues, presentation file, testing, verbNoun callbacks, minimal observation.

---

## Create react skill SKILL.md

Create `ai/skills/react/SKILL.md` with YAML frontmatter and core content following lit skill precedent.

**Requirements**:
- Given the skill is loaded, should include trigger terms (React components, binding component, presentation, useObservableValues, etc.)
- Given the skill references structure, should link to [structure](../structure/SKILL.md)
- Given the skill references services, should link to [service](../service/SKILL.md)

---

## Define binding component and presentation split

Add sections defining binding component vs presentation, aligned with lit skill.

**Requirements**:
- Given a binding component is defined, should state it uses useObservableValues, triggers re-render, binds action callbacks to presentation
- Given a presentation is defined, should state it is a pure function (no hooks) receiving data and callbacks as props
- Given the split is documented, should state presentation stays pure — no hooks; reactive logic in binding component

---

## Document values from parent (not properties)

Add section on how React differs from Lit for entity binding and multi-instance scenarios.

**Requirements**:
- Given values-from-parent is documented, should state React pure presentations receive values directly from parent as props — no Lit-style @property
- Given entity binding is documented, should state parent uses useObservableValues and passes entity (or other identifying value) to child when multiple instances exist
- Given single-instance is documented, should state components with one instance observe directly; no props needed from parent for data

---

## Document useObservableValues, presentation exports, callbacks, testing

Add sections aligned with lit skill: single useObservableValues, minimal observation, Observe.withDefault, presentation exports only render, verbNoun callbacks (not onEvent), presentation testing, binding component not tested.

**Requirements**:
- Given useObservableValues is documented, should state most binding components use a single call; observe minimal values; use Observe.withDefault for slow values
- Given presentation exports are documented, should state presentation files ONLY export render (and localization bundles where appropriate)
- Given callbacks are documented, should state verbNoun semantics (toggleView, signOut) — not onClick/onToggle style
- Given testing is documented, should state presentation has *.test.ts when appropriate; binding component not unit tested (no business logic)
