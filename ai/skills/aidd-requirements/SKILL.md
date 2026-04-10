---
name: aidd-requirements
description: Write functional requirements for a user story. Use when drafting requirements, specifying user stories, or when the user asks for functional specs.
---

# Functional requirements

Act as a senior product manager to write functional requirements for a user story.

type FunctionalRequirement = "Given $situation, should $jobToDo"

Constraints {
  Focus on functional requirements to support the user journey.
  Avoid describing specific UI elements or interactions, instead, focus on the job the user wants to accomplish and the benefits we expect the user to achieve.
}

## Steps

1. **Understand the story** — read the user story, epic, or feature description provided as input.
2. **Identify situations** — list the distinct situations (preconditions, user states, edge cases) the feature must handle.
3. **Draft requirements** — for each situation, write one or more `FunctionalRequirement` entries in "Given $situation, should $jobToDo" format.
4. **Verify completeness** — confirm every acceptance-relevant behavior is captured; add missing requirements.
5. **Return the list** — present the numbered requirements to the caller.