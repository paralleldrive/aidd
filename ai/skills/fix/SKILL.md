---
name: aidd-fix
description: >
  Fix a bug or implement review feedback following the AIDD fix process.
compatibility: Requires git, npm, and a test runner (vitest) available in the project.
---

# 🐛 aidd-fix

Fix a bug or implement review feedback following the structured AIDD fix process.

Constraints {
  Do ONE step at a time. Do not skip steps or reorder them.
  Run lint, unit and e2e tests prior to committing code. Planning and documentation (epics, /plan files, /docs, etc) are exempt.
  Never implement before writing a failing test.
  Never write a test after implementing — that is not TDD.
}

## Step 1 — Gain context and validate

Given a bug report or review feedback:

1. Read the relevant source file(s) and colocated test file(s)
2. Read the task epic in `$projectRoot/tasks/` that covers this area
3. Reason through or reproduce the issue to confirm it exists
4. If **no change is needed**: summarize findings and stop — do not modify any files

## Step 2 — Document the requirement in the epic

If a fix is required:

1. Locate the existing task epic that covers this area of the codebase
2. If no matching epic exists, create one at `$projectRoot/tasks/<name>-epic.md` using `/task`
3. Add a requirement bullet in **"Given X, should Y"** format that precisely describes the correct behavior
4. The epic update is its own discrete step — commit it separately or include it in the fix commit with a clear message

epicConstraints {
  Requirements must follow "Given X, should Y" format exactly.
  No implementation detail in the requirement — describe observable behavior only.
}

## Step 3 — TDD: write a failing test first

Using `/execute`:

1. Write a test that captures the new requirement
2. Run the unit test runner and confirm the test **fails**

  ```sh
  npm run test:unit
  ```

3. If the test passes without any implementation change: the bug may already be fixed or the test is wrong — stop and reassess before proceeding

## Step 4 — Implement the fix

1. Write the minimum code needed to make the failing test pass
2. Run the unit test runner — **fail → fix bug → repeat; pass → continue**

  ```sh
  npm run test:unit
  ```

3. Implement ONLY what makes the test pass — do not over-engineer or clean up unrelated code

## Step 5 — Run e2e tests and self-review

1. Run the full e2e suite and confirm all tests pass

  ```sh
  npm run test:e2e
  ```

2. Run `/review` to self-review all changes
3. Resolve any issues found before moving to the next step

## Step 6 — Commit and push

Using `/commit`:

1. Stage only the files changed by this fix
2. Write a conventional commit message: `fix(<scope>): <description>`
3. Push to the PR branch

  ```sh
  git push -u origin <branch-name>
  ```

Commands {
  🐛 /aidd-fix - fix a bug or review feedback following the full AIDD fix process
}
