---
description: Scaffold design system and shadcn components after Phase 1 automation
globs: **/app/**,**/components/**,**/stories/**
alwaysApply: false
---

# 🏗️ Scaffold

Use this command after running `npx aidd create-next-shadcn` to complete Phase 2 of the setup: adding shadcn UI and building a baseline design system.

## Prerequisites

You should have already run:
```bash
npx aidd create-next-shadcn [project-name]
```

This command completes Phase 1 (deterministic setup) and gives you a working Next.js app with:
- TypeScript & ESM
- Vitest + Riteway for unit tests
- Playwright for E2E tests
- Storybook
- AIDD framework installed

## Phase 2: Design System with shadcn

Now you'll add shadcn UI and build a baseline design system.

### Step 1: Install shadcn

First, search for the latest official shadcn installation instructions for Next.js App Router.

Then follow the current recommended setup. Document the exact commands you run.

Typically this looks like:
```bash
npx shadcn@latest init
```

### Step 2: Build Baseline Design System

Create a simple design system story that includes:

**Components to build:**
- Standard button components (variants, sizes, disabled, loading)
- Toggle switch
- Input elements (text, textarea, select if applicable)
- Semantic colors: error, warning, success, primary
- Focus and hover states for all interactive components

**Location:**
- Place design system stories under `src/stories/design-system`
- Use Storybook CSF format

### Step 3: Responsive Primary Actions

Implement primary actions in two responsive styles:
- **Mobile**: centered circular primary action
- **Desktop**: primary action button

### Step 4: TDD Process

- Use TDD for any custom components you create
- Follow `ai/rules/tdd.mdc` carefully
- Follow JavaScript best practices in `ai/rules/javascript`

### Step 5: Style Guidance

Before starting implementation, prompt the user for guidance on the visual look and feel of the application.

After they respond, continue with the task epic, then present it for feedback.

### Step 6: Review

Use your own `/review` of your changes as the approval gate before moving to the next step in the TDD process.

## Exit Criteria

Before considering this complete:

- [ ] Storybook shows all components and states listed above
- [ ] Visual and interaction a11y basics: keyboard nav, visible focus, acceptable contrast
- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)

## Final Review

Once all work is complete, `/review` the code:

- Reduce duplication
- Ensure the TDD process was carefully adhered to, identify and fix any gaps
- Present findings and ask for advice before any further work

## References

- Phase 1 setup details: `docs/new-project-setup-nextjs-shadcn.md`
- JavaScript style guide: `ai/rules/javascript`
- TDD guide: `ai/rules/tdd.mdc`
