# aidd-craft-skill

Creates and reviews AIDD skills — the reusable instruction modules that guide
agent behavior across a project.

## Why

Skills written without a clear structure accumulate bloat, mix concerns, and
become hard to maintain. `aidd-craft-skill` applies a consistent authoring
standard: each skill is a named function with defined inputs and outputs,
sized to stay concise, and organized for progressive disclosure.

## Commands

```
/aidd-craft-skill create [name]
```

Scaffolds a new skill at `aidd-custom/aidd-[name]/SKILL.md` with the required
frontmatter, sections, and directory layout.

```
/aidd-craft-skill review [target]
```

Evaluates an existing skill against authoring criteria: function test,
required sections, size thresholds, command separation, and README quality.
Reports issues and a pass/fail verdict.

## When to use

- Creating a new skill from scratch in `ai/skills/` or `aidd-custom/skills/`
- Reviewing or refactoring an existing skill for quality and consistency
- Checking whether a candidate abstraction is ready to become a named skill
