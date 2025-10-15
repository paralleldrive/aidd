## ⚡ Quick Actions

Shortcuts for common AIDD workflows using minimal keystrokes.

**Available Quick Actions:**

---

### `qq` - Quick Task

Create and optionally execute a task using smart defaults.

**Usage:** `qq [description]`

**Example:** `qq Add loading spinner to submit button`

**What it does:**
1. Infers scope from description (Small/Medium/Large)
2. Uses smart defaults for all questions:
   - State management: Inferred from description
   - Testing: Standard level
   - Design system: Project default (Easel)
   - Execution: Semi-auto
3. Generates task with Pre-Flight Validation
4. Shows summary and asks: "Execute now? [y/n]"

**Equivalent to:**
```
/start
1 (new task)
1 (knows what to build)
[auto-selected scope]
[description]
[all defaults selected]
```

---

### `qe` - Quick Execute

Execute the most recent pending task.

**Usage:** `qe`

**What it does:**
1. Finds last pending task in aidd-planning/aidd-eng-plan.md
2. Shows: "Execute Task X: [name]? [y/n]"
3. If yes: Runs /execute with semi-auto mode

**Equivalent to:**
```
/start
2 (continue existing)
[select last pending]
1 (execute)
```

---

### `qc` - Quick Commit

Log and commit in one action.

**Usage:** `qc`

**What it does:**
1. Runs /log (detects changes, updates activity log)
2. Runs /commit (creates conventional commit)
3. Single workflow, minimal prompts

**Equivalent to:**
```
/log
[approve log entry]
/commit
[approve commit message]
```

---

### `qa` - Quick All

Complete workflow: Execute → Log → Commit → Review

**Usage:** `qa [task-file]`

**Example:** `qa task-3-analytics.md`

**What it does:**
1. Validates task file
2. Executes with semi-auto mode
3. Logs completion
4. Creates commit
5. Runs code review
6. Reports all results

**Equivalent to:**
```
/execute task-file
[approve steps]
/log
[approve]
/commit
[approve]
/review
```

**Checkpoints:** Only pauses for:
- Step validation failures
- Final approval before commit

---

### `q?` - Quick Help

Show quick action reference.

**Usage:** `q?`

**What it does:** Lists all quick actions with brief descriptions

---

## Implementation

Quick actions use aidd-core-wizard.mdc for smart default inference and validation.

Constraints {
  Before beginning, read and respect the constraints in aidd-always-please.mdc
  Use smart defaults from project settings
  Infer intent from description
  Minimize questions to user
  Still run all validations
  Pause on errors/failures
  Provide summary before final actions
  Allow cancellation at checkpoints
}

## Quick Action Pattern

quickActionTemplate(action, args) {
  1. Parse input
  2. Apply smart defaults
  3. Generate plan/execute action
  4. Show summary
  5. Ask for confirmation
  6. Execute if approved
  7. Report results
}

## Smart Default Sources

readProjectDefaults() {
  designSystem = readFrom('aidd-org-ui.mdc')
  techStack = readFrom('aidd-org-stack.mdc')
  testingPrefs = inferFrom(existingTests)
  
  return {
    designSystem: designSystem.primary,
    testingLevel: 'standard',
    executionMode: 'semiAuto',
    orchestrationThreshold: 2
  }
}
