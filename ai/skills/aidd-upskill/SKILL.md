---
name: aidd-upskill
description: Guide for crafting high-quality AIDD skills. Use when creating, reviewing, or refactoring skills in ai/skills/ or aidd-custom/skills/.
---

# aidd-upskill

## Role

Expert skill author. Craft skills that are clear, minimal, and recomposable, giving agents exactly the context they need — nothing more.

**Skill components:** `ai/skills/aidd-sudolang-syntax`, `ai/skills/aidd-rtc`

**SudoLang spec:** https://github.com/paralleldrive/sudolang/blob/main/sudolang.sudo.md — generated skills must follow SudoLang syntax.

Constraints {
  Prefer natural language in markdown format
  Use SudoLang interfaces, pattern matching, and /commands for formal specification
  (logic is deterministic) => CLI tool or compiled Bun bundle
  (logic requires judgment) => AI prompt
  (a candidate abstraction cannot be named) => it is not an abstraction yet
  (two or more skills share the same f) => extract a shared abstraction
}

Commands {
  /aidd-upskill create [name] — scaffold a new skill at aidd-custom/skills/aidd-[name]/SKILL.md
  /aidd-upskill review [target] — evaluate a skill against the criteria in this guide
}

> This skill is itself an example of the structure it prescribes.

import references/types.md
import references/process.md

## Process

The `createSkill` and `reviewSkill` pipelines — including all step definitions — are defined in
`references/process.md` (imported above). Read that file for the full authoring and review
workflows.

---

## Skill Structure

```
ai/skills/aidd-<verbOrRoleBasedNoun>/
├── SKILL.md          # Required: frontmatter + instructions
├── README.md         # Optional: what the skill is, why it's useful, command reference
├── scripts/          # Optional: CLI tools
├── references/       # Optional: detailed reference docs
└── assets/           # Optional: templates, data files
```

## Progressive Disclosure

1. `name` + `description` — loaded at startup for all skills
2. Full `SKILL.md` body — loaded on activation
3. `scripts/`, `references/`, `assets/` — loaded on demand

Keep `SKILL.md` concise — run `validate-skill` to check thresholds. Move reference material to `references/`. Use `import $referenceFile` to link it.

---

## A Skill Is a Function

```
f: Input → Output
```

Every skill maps input context to output or action. Use this as the primary design lens.

### Abstraction

Two skills sharing the same `f` should share the same abstraction:

- **Generalization:** extract the shared `f`, name it, hide it
- **Specialization:** expose only what differs as parameters

```
f: A → B
g: B → C
h: A → C   ← h hides B. This is a good abstraction.
```

> "Simplicity is removing the obvious and adding the meaningful." — John Maeda

### The Function Test

1. What is `f`? Name it. If you can't name it, it's not an abstraction yet.
2. What varies? Those are the parameters — expose them.
3. What is constant? Those are the defaults — hide them.
4. Is `f` deterministic? See CLI vs. AI prompt in Constraints above.
5. Is the result independently useful and recomposable? If not, it's inlining, not abstraction.

### Default Parameters

Use defaults wherever the default is obvious. Callers supply only what is meaningfully different. If every caller passes the same value, it's a default waiting to be named.

---

## Eval Tests

Use Riteway AI to write eval tests for skill commands. The Riteway AI skill may be available as `aidd-riteway-ai` in your project's `ai/skills/` directory.

**Core principle:** never mix thinking and effects in a single `/command`. Break commands into sub-commands or separate skills so every thinking stage is independently testable.

```
(command involves thinking + side effects) => split into sub-commands
(command is a pure thinking stage) => write an eval test
(command is a side effect only) => skip the test
```

### Eval Test Structure

Tests are `.sudo` files using SudoLang syntax:

````
# my-skill-test.sudo

import 'path/to/skill.md'

userPrompt = """
<the prompt or command input being tested>
"""

- Given <context>, should <expected thinking output>
- Given <context>, should <expected thinking output>
````

Run with:

```shell
riteway ai path/to/my-skill-test.sudo
```

Defaults: 4 passes, 75% pass rate threshold, claude agent.
