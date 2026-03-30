# aidd-requirements

Writes functional requirements for user stories using a standardized
"Given X, should Y" format focused on user outcomes.

## Why

Vague requirements lead to scope creep and missing features. A consistent
format forces clarity about the situation and expected behavior, making
requirements testable and unambiguous.

## Usage

Invoke `/aidd-requirements` with the user story. Each requirement
follows this template:

```
Given <situation>, should <job to do>
```

Requirements focus on the job the user wants to accomplish and the benefit they
achieve — no specific UI elements or interactions.

## When to use

- Drafting requirements for a new user story
- Specifying acceptance criteria
- Reviewing whether existing requirements are complete and testable
