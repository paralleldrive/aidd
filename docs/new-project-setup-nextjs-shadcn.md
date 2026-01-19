# New Project Setup with aidd Framework

Goal: scaffold a new Next.js app with AIDD, tests, and a baseline design system epic.

Use npm. Do not use pnpm, yarn, or bun.

## Phase 1: Deterministic scaffold (do not start Phase 2 until Phase 1 is fully green)

Use npx create-next-app to create an app for the landing page. Accept the defaults, and ensure it uses the Next.js App Router, then:

- npx aidd --cursor && npm install aidd

Install and configure:
- TypeScript with native ESM expectations for this repo
- Unit test runner: Vitest
- Component test library: Riteway
- E2E: Playwright
- Storybook

Set up:
- Baseline unit tests and e2e tests
- npm scripts for: test, test:watch, test:e2e, test:ui, storybook, build, lint, typecheck
- Script semantics:
  - npm test runs unit tests, then lint --fix
  - npm run test:e2e runs Playwright headless
- CI ready test command that runs headless and deterministic

Exit criteria for Phase 1:
- npm test passes
- npm run test:e2e passes
- npm run storybook builds or runs cleanly
- npm run build succeeds
- npm run typecheck passes

Stop A: Stop here. Report what was installed, what was configured, and the exact commands to run. Then wait.

## Phase 2: Design system epic

1. Install shadcn and all required dependencies.
   - First, use web search to find the latest official shadcn installation instructions.
   - Follow the current recommended Next.js App Router setup.
   - Document the exact commands you ran and any config changes.

2. Create a /task epic (see ai/skills/aidd/task.md) for the work below.

3. Build a simple design system story that includes:
   - Standard button components (variants, sizes, disabled, loading)
   - Toggle switch
   - Input elements (text, textarea, select if applicable)
   - Semantic colors: error, warning, success, primary
   - Focus and hover states for all interactive components
   - Place design system stories under src/stories/design-system and use Storybook CSF unless told otherwise.

4. Implement primary actions in two responsive styles:
   - Mobile: centered circular primary action
   - Desktop: primary action button

5. Use TDD for any custom components you create.
   - Follow ai/skills/aidd/references/tdd.md carefully.

6. Follow JavaScript best practices in ai/skills/aidd/references/javascript.md.

7. Apply the style prompt below for visual look and feel guidance.

8. Use your own /review of your changes as the approval gate before moving to the next step in the TDD process.

Exit criteria for Phase 2:
- Storybook shows the components and states listed above
- Visual and interaction a11y basics: keyboard nav, visible focus, acceptable contrast
- All tests pass

## Style Prompt

Prompt me for guidance on the visual look and feel of my application before you begin.

After I respond, continue with the task epic, then present it to me for feedback.

Stop B: Stop here and wait for approval, then /execute the task following the instructions in the ai/skills/aidd/references folder carefully.

Once that work is complete, please /review all the code you have written so far:

- Reduce duplication
- Ensure the tdd process was carefully adhered to, identify and fix any gaps
- Present findings and ask for advice before any further work and then wait for instruction
