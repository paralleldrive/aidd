# aidd-stack

Tech stack guidance for building features with NextJS + React/Redux + Shadcn UI,
deployed on Vercel.

## Why

Consistent stack conventions prevent architectural drift. This skill ensures
features are built with the project's chosen patterns — functional programming,
container/presentation split, Autodux for Redux, and TDD.

## Usage

Invoke `/aidd-stack` when implementing full-stack features. The stack uses
Next.js, React with Redux (via Autodux, not Redux Toolkit), Redux Saga for
side effects, and Shadcn UI for components. Always use TDD (`/aidd-tdd`) when
implementing source code changes.

## When to use

- Implementing full-stack features with the project's technology stack
- Choosing architecture patterns for a NextJS + React/Redux + Shadcn project
