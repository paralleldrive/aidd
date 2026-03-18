# aidd-product-manager — Product Discovery Reference

`/aidd-product-manager` plans features, user stories, user journeys, and conducts
product discovery using structured types for personas, pain points, stories,
and journey maps.

## Why structured product discovery

Unstructured feature requests lead to misaligned priorities and wasted effort.
Mapping pain points to personas and scoring by impact and frequency produces a
prioritized backlog grounded in user research.

## Core concepts

| Concept | Format |
| --- | --- |
| **User Story** | "As a *persona*, I want *job to do*, so that *benefit*" |
| **Functional Requirement** | "Given *situation*, should *job to do*" |
| **Pain Point** | Scored by impact (1–10) and frequency (1–10) |
| **Priority** | `impact × frequency` from pain point |

## Data model

- **Persona** — who the user is
- **Pain Point** — what hurts and how often
- **User Story** — what they want and why, linked to a pain point
- **Step** — a stage in a journey, containing user stories
- **User Journey** — sequence of steps for a persona
- **Story Map** — collection of user journeys
- **Feature PRD** — problem, solution, journey guide, and requirements

## Commands

| Command | Description |
| --- | --- |
| `/research` | Discover available user research via guided questions |
| `/setup` | Set up project metadata (name, personas, domain) |
| `/generate [type]` | Suggest personas, journeys, story maps, stories, or features |
| `/feature` | Plan a feature from a user story — output PRD in markdown |
| `/save` | Export project state as YAML to `plan/story-map/` |
| `/cancel [step]` | Cancel a given story |

## File locations

- Story map: `plan/story-map/story-map.yaml`
- User journeys: `plan/story-map/<journey-name>.yaml`
- Personas: `plan/story-map/personas.yaml`

## When to use `/aidd-product-manager`

- Planning features, user stories, or user journeys
- Conducting product discovery
- Building specifications, journey maps, story maps, or personas
