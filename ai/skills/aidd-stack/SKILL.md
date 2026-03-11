---
name: aidd-stack
description: Recommends tech stack and best practices. Use when choosing technologies for a new app or feature, when asked what stack to use, when implementing cross-cutting concerns (TypeScript style, Redux, build tooling), or when you need greenfield recommendations by application type.
---

# Tech Stack

Act as a top-tier senior full stack software engineer. Always use best practices, declarative approaches, concise code.

## When to use this skill

- **Choosing stack** — New app, new feature, or “what should I use?” questions.
- **Greenfield by app type** — Use the application-type matrix below to recommend technologies.
- **Planning new application** - IMPORTANT! Make sure that once you choose a stack that you install all of the stack dependencies and review each dependencies AGENTS.md file BEFORE you begin formal planning. The information within each is necessary to guide using them correctly.
- **Implementation details** — For Lit, React, or ECS, defer to [aidd-lit](../aidd-lit/SKILL.md), [aidd-react](../aidd-react/SKILL.md), and [aidd-ecs](../aidd-ecs/SKILL.md); use this skill for *which* tech and high-level practices, not component/service authoring.

## How to use this skill

1. Before using any tech from this stack, list relevant best practices for that technology and keep them in mind as you code.
2. When recommending stack, start from the greenfield matrix if the app type is known; otherwise reason from requirements.
3. If recommending a structure follow [aidd-structure](../aidd-structure/SKILL.md)

## Recommendations

web business application: [typescript, lit, ecs, vite, pnpm]
web 3d game: [typescript, lit (menus), webgpu (graphics), ecs, vite, pnpm]
web 2d game with animations: [typescript, react (menus), @pixi/react (graphics), ecs, vite, pnpm]
mobile 2d game [typescript, @pixi/react (menus and graphics), ecs, vite, pnpm]

## Typescript

Use typescript projects to enforce dependencies. See [aidd-ts-projects](../aidd-ts-projects/)
Always use functional programming approaches.
Favor pure functions, immutability, function composition, and declarative approaches.
Favor `const` over `let` and `var` whenever possible.
Always separate state management, UI, and side-effects from each other in different modules.

## UI (pick one)

Never suggest combining these.

### Lit

See [aidd-lit](../aidd-lit/SKILL.md)

### React

See [aidd-react](../aidd-react/SKILL.md)

## State (pick one)
Never suggest combining these.

### ECS (@adobe/data)

See [aidd-ecs](../aidd-ecs/SKILL.md)

Simple, high performance with good agentic integration. Designed for modeling both persistent application state and transient rendering/ui state.

### Redux

Avoid Redux Toolkit. Use frameworks/redux/autodux and redux connect instead.

1. Build the Autodux dux object and save it as "${slice name}-dux.sudo"
2. Transpile to JavaScript and save it as "${slice name}-dux.js"

Constraints {
  ALWAYS use tdd as defined in tdd.mdc when implementing source code changes.
  NEVER change source code without clear requirements, tests, and/or manual user approval of your plan.
}