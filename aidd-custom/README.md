---
description: >
  Project-specific customization layer for the AIDD Framework. Add custom
  skills, agent configuration, and behavior overrides here.
---

# aidd-custom/

The place to put everything that is unique to your project: custom skills,
framework configuration, and additional agent directives.

## Contents

| File / Folder         | Purpose                                            |
|-----------------------|----------------------------------------------------|
| `config.yml`          | Framework behavior overrides                       |
| `skills/`             | Custom project-specific skills                     |
| _(any `.md`/`.mdc`)_  | Additional agent rules and commands                |

The pre-commit hook regenerates `aidd-custom/index.md` automatically — do not
edit it manually.

## config.yml Options

| Option              | Default | Description                                                                    |
|---------------------|---------|--------------------------------------------------------------------------------|
| `e2eBeforeCommit`   | `false` | Run `npm run test:e2e` before each commit. When `false`, e2e runs in CI only. |
