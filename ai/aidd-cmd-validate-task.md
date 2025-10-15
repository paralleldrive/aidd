## 🔍 Validate Task

Run Pre-Flight Validation Gate on a task file to ensure it meets all AIDD framework requirements.

**Usage:** `/validate-task [path-to-task-file]`

**Example:** `/validate-task aidd-planning/task-1-app-video-card-structure.md`

---

## Command Description

Validates existing task files against AIDD framework quality requirements by calling the validation shell script and presenting results in an interactive format with auto-fix capabilities.

**Implementation:** Calls `aidd-validate-task.sh` shell script for validation logic, then adds interactive features.

---

## Validation Process

### Step 1: Execute Validation Shell Script

**Run the validation script:**
```bash
bash .cursor/aidd-validate-task.sh "$TASK_FILE"
```

**Capture:**
- Exit code (0 = all checks passed, 1 = one or more failed)
- Standard output (validation report with ✅/❌ indicators)
- Error details and violation counts

**Example output from script:**
```
🚀 AIDD Pre-Flight Validation Gate
Task: aidd-planning/task-1.md

✓ Check 1: Mandatory Sections
  ✅ CodeContext
  ❌ MISSING: StyleGuides
  ✅ Validation Scripts

✓ Check 2: Subjective Language
  ❌ Found 3 subjective terms

✓ Check 3: ValidationScripts Format
  ✅ Section exists

❌ VALIDATION FAILED (2 errors)
```

---

### Step 2: Parse Script Output

**Extract from shell script output:**

- **Check statuses:** Which of the 5 checks passed/failed
- **Error count:** Total number of violations
- **Specific violations:** What exactly is wrong
- **Exit code:** Overall pass/fail status

**Parse patterns:**
```bash
# Check if passed
exit_code == 0 → Overall PASS

# Parse check results
"✅ CodeContext" → Check 1 section present
"❌ MISSING: StyleGuides" → Check 1 violation

# Parse error counts
"Found 3 subjective terms" → 3 violations in Check 2
"VALIDATION FAILED (2 errors)" → Total error count
```

---

### Step 3: Present Formatted Report in Chat

**Transform shell script output into user-friendly chat report:**

```markdown
# Task Validation Report

**Task File:** aidd-planning/task-1-app-video-card-structure.md
**Validation Date:** 2025-01-15
**Shell Script:** .cursor/aidd-validate-task.sh

---

## Validation Results

### Check 1: Mandatory Sections ❌ FAIL

- ✅ CodeContext - Present
- ❌ StyleGuides - **MISSING**
- ✅ State Management Strategy - Present
- ✅ Validation Scripts - Present
- ✅ Success Criteria - Present
- ✅ Requirements - Present

**Issue:** StyleGuides section is mandatory but not found in task file.

**Suggested Fix:** Add StyleGuides section with template from aidd-core-task-creator.mdc

---

### Check 2: Subjective Language ❌ FAIL

**Found:** 3 subjective terms in Success Criteria section

**Violations:**
1. Line ~45: "Component has **distinct** visual design"
   - **Fix:** Replace with "Component uses background='secondary' for container"
   - **Add validation:** `grep 'background="secondary"' component.tsx`

2. Line ~47: "**Clean** hierarchy between sections"
   - **Fix:** Replace with "Heading uses size='large', body uses size='small'"
   - **Add validation:** `grep 'size="large"' component.tsx`

3. Line ~52: "**Properly** exported from module"
   - **Fix:** Replace with "Component exports via index.ts with named export"
   - **Add validation:** `grep 'export { Component }' index.ts`

---

### Check 3: ValidationScripts Format ✅ PASS

- ✅ Validation Scripts section exists
- ✅ Properly separated from Success Criteria

---

### Check 4: Implementation Step Sizes ✅ PASS

- ✅ Step 1: 15 lines
- ✅ Step 2: 18 lines
- ✅ Step 3a: 12 lines
- ✅ Step 3b: 15 lines

---

### Check 5: Agent Orchestration Logic ✅ PASS

- Domains checked: 2
- Specializations checked: 1
- Expected decision: YES
- Actual decision: YES
- ✅ Logic correct
- ✅ Dispatch command present

---

## Summary

**Overall Status:** ❌ FAILED

**Pass Rate:** 3/5 checks passed (60%)

**Errors Found:** 2 violations
1. Missing StyleGuides section (1 error)
2. Subjective language (3 terms)

**Action Required:** Auto-fix available or manual revision needed

---

## Auto-Fix Available

I can automatically fix these violations:

**Fix 1: Add Missing StyleGuides Section**
- Add section header: "## StyleGuides (MANDATORY)"
- Add template content from framework
- Flag for you to complete with specific .mdc references

**Fix 2: Replace Subjective Terms (3 replacements)**
- Replace "distinct visual design" with objective measurement
- Replace "clean hierarchy" with specific sizes
- Replace "properly exported" with verification command
- Add corresponding validations to ValidationScripts section

**Would you like me to auto-fix these violations?**

**Options:**
- Type **"yes"** to auto-fix all violations
- Type **"manual"** to fix yourself
- Type **"details"** for more info on each violation
- Type **"skip"** to ignore and proceed anyway (not recommended)
```

---

### Step 4: Offer Auto-Fix (Interactive Enhancement)

**If user responds "yes":**

1. **Apply Auto-Revision Rules** from aidd-core-task-creator.mdc
2. **Fix each violation:**
   - Missing sections → Add template
   - Subjective language → Replace with objective
   - Oversized steps → Break into sub-steps
   - Wrong orchestration → Correct logic
   - Embedded validations → Separate section

3. **Write updated task file**

4. **Re-run validation script:**
   ```bash
   bash .cursor/aidd-validate-task.sh "$TASK_FILE"
   ```

5. **Report results:**
   ```
   ✅ Auto-fix complete!
   
   Applied fixes:
   - Added StyleGuides section
   - Replaced 3 subjective terms with objective criteria
   - Added 3 validation commands to ValidationScripts
   
   Re-validation: ✅ PASSED
   
   Task is now ready for AI execution.
   ```

**If user responds "manual":**
- Present detailed fix instructions
- Don't modify file
- Offer to re-validate after user fixes

**If user responds "details":**
- Show detailed explanation of each violation
- Show exact line numbers
- Show before/after examples
- Offer auto-fix again

---

## Constraints

Before beginning validation:
- Read and respect constraints in aidd-always-please.mdc
- **Call aidd-validate-task.sh for actual validation logic**
- Parse script output to create user-friendly report
- Do NOT duplicate validation logic (use shell script)
- Do NOT modify task file during validation (only during auto-fix)
- Report violations clearly with specific examples
- Suggest actionable fixes for each violation
- Offer auto-fix as optional separate action

**During validation:**
- Execute shell script and capture output
- Parse exit code and output text
- Transform into formatted chat report
- Present clear pass/fail status

**During auto-fix:**
- Apply Auto-Revision Rules from aidd-core-task-creator.mdc
- Modify task file to fix violations
- Re-run shell script to verify fixes
- Report auto-fix results

**After validation:**
- Present clear pass/fail status
- If failed: Show specific violations and offer auto-fix
- If passed: Confirm readiness for execution
- Always show what the shell script reported

---

## Integration with Other Commands

### Called Automatically by /task

```
/task workflow:
  1. User: "/task Create component"
  2. System: Generate task using task-creator
  3. System: Run internal Pre-Flight Validation (same 5 checks)
  4. If fails: Auto-revise (max 3 attempts)
  5. If still fails: User sees validation report (like /validate-task output)
  6. When passes: Present task for approval
```

**Note:** `/task` uses internal validation during creation, not the shell script (because task doesn't exist as file yet)

---

### Manual Validation with /validate-task

```
/validate-task workflow:
  1. User: "/validate-task aidd-planning/task-1.md"
  2. System: Execute shell script on existing file
  3. System: Parse script output
  4. System: Present formatted report in chat
  5. If violations: Offer auto-fix
  6. If auto-fix accepted: Fix and re-run script
  7. Report final status
```

---

### Before Execution with /execute

```
/execute workflow:
  1. User: "/execute task-1.md"
  2. System: Run /validate-task on file first
  3. If validation fails: Block execution, show report
  4. If validation passes: Proceed with execution
```

---

## Command Implementation

**How Cursor implements this command:**

```
When user types "/validate-task [file]":
  
  1. Verify file exists:
     ls "$TASK_FILE" || error("File not found")
  
  2. Execute validation shell script:
     result = exec("bash .cursor/aidd-validate-task.sh $TASK_FILE")
     exitCode = result.exitCode
     output = result.stdout
  
  3. Parse script output:
     violations = parseValidationOutput(output)
     checkStatuses = extractCheckResults(output)
     errorCount = extractErrorCount(output)
  
  4. Format report for chat:
     report = formatValidationReport(violations, checkStatuses)
     presentToUser(report)
  
  5. If violations found (exitCode == 1):
     offerAutoFix(violations)
     
     if userAcceptsAutoFix:
       applyAutoRevisionRules(violations)
       reRunValidation()
       reportResults()
```

---

## Why This Design is Better

**Single Source of Truth:**
- Validation logic lives in shell script ONLY
- Cursor command just calls it and adds interactivity
- Update validation rules in ONE place

**Consistency:**
- Shell script and command always use same checks
- Can't get out of sync
- Easier to maintain

**Testability:**
- Can test shell script independently
- Can verify Cursor calls it correctly
- CI/CD uses same validation as Cursor

**Separation of Concerns:**
- Shell script = Pure validation logic
- Cursor command = UI layer + auto-fix

---

## Updated Command Definition

The artifact above shows the corrected design where:

**Step 1:** Execute shell script
**Step 2:** Parse its output
**Step 3:** Present formatted report
**Step 4:** Offer auto-fix (Cursor's value-add)

This makes the command a **wrapper around the shell script**, not a duplicate implementation.

---

## Bottom Line

**Originally designed (wrong):** Command re-implements validation
**Corrected design (right):** Command **calls** shell script, adds auto-fix

The artifact I just created has the corrected design. Want me to write this corrected version to the filesystem?
