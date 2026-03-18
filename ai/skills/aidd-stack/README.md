# aidd-stack — Tech Stack Reference

`/aidd-stack` provides guidance for building features with the NextJS +
React/Redux + Shadcn UI stack, deployed on Vercel.

## Stack overview

| Layer | Technology |
| --- | --- |
| Framework | Next.js |
| UI Library | React |
| State Management | Redux (via Autodux, not Redux Toolkit) |
| Side Effects | Redux Saga |
| Component Library | Shadcn UI |
| Deployment | Vercel |

## JavaScript conventions

- Functional programming: pure functions, immutability, function composition
- `const` over `let` and `var`
- Separate state management, UI, and side effects into different modules

## React conventions

- Always use the container/presentation pattern for persisted state
- Containers never contain direct UI markup — import and use presentations
- Containers never contain business logic — use `react-redux connect`

## Redux conventions

- Avoid Redux Toolkit — use `frameworks/redux/autodux` and `redux connect`
- Author dux objects in SudoLang (`${slice}-dux.sudo`), transpile to JavaScript
  (`${slice}-dux.js`)

## Constraints

- Always use TDD (`/aidd-tdd`) when implementing source code changes
- Never change source code without clear requirements, tests, and/or user approval

## When to use `/aidd-stack`

- Implementing full-stack features with the project's technology stack
- Choosing architecture patterns for a NextJS + React/Redux + Shadcn project
