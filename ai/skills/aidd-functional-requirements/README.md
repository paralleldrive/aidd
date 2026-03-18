# aidd-functional-requirements — Requirement Specification Reference

`/aidd-functional-requirements` writes functional requirements for user stories
using a standardized "Given X, should Y" format focused on user outcomes rather
than implementation details.

## Why structured requirements matter

Vague requirements lead to scope creep, missing features, and wasted effort.
A consistent format forces clarity about the situation and the expected behavior,
making requirements testable and unambiguous.

## Format

Every functional requirement follows this template:

```
Given <situation>, should <job to do>
```

**Examples:**

- Given an invalid email address, should display a validation error without submitting
- Given a user with no saved payment method, should prompt for payment before checkout
- Given a search query with no results, should suggest alternative search terms

## Constraints

- Focus on the **job the user wants to accomplish** and the **benefit** they achieve
- Avoid describing specific UI elements or interactions (no "click the button",
  "show a modal")
- Each requirement should be independently testable

## When to use `/aidd-functional-requirements`

- Drafting requirements for a new user story
- Specifying acceptance criteria
- Reviewing whether existing requirements are complete and testable
