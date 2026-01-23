# User Test Script Templates

## Complete Human Test Script

```markdown
# User Test: {Journey Name}

**Date**: {date}
**Participant ID**: {id}
**Persona**: {persona.name} — {persona.role}

---

## Pre-test Checklist

- [ ] Screen recording software ready
- [ ] Browser cleared (cookies, cache, history)
- [ ] Test account credentials prepared
- [ ] Quiet environment confirmed
- [ ] Participant briefed on think-aloud protocol

---

## Think-Aloud Protocol

Please verbalize your thoughts as you complete each task:
- What you see on the screen
- What you expect to happen
- Any confusion or frustration
- What you're trying to do

---

## Tasks

### Task 1: {step.name}

**Scenario**: {context}

**Goal**: {step.intent}

**Instructions**: {step.action}

**Success Criteria**: {step.success}

**Observer Notes**:
- Time started: ___
- Time completed: ___
- Errors encountered: ___
- Assistance needed: ___
- Emotional response: ___

---

## Post-test Interview

1. Overall, how easy or difficult was this process? (1-10)
2. What was the most frustrating part?
3. What was the most satisfying part?
4. What would you change?
5. Would you use this in real life? Why/why not?
6. Any other comments?

---

## Observer Summary

**Completion Rate**: ___ / ___ tasks
**Critical Issues**:
**Recommendations**:
```

---

## Complete AI Agent Test Script

```markdown
# Automated User Journey Test: {Journey Name}

## Configuration

```yaml
journey: {journey.name}
persona:
  name: {persona.name}
  techLevel: {novice|intermediate|expert}
  patience: {1-10}
environment:
  browser: chromium
  viewport: 1280x720
  timeout: 30000
```

## Persona Behavior Model

- **Navigation**: {techLevel == "expert" ? "direct" : "exploratory"}
- **Error Response**: {patience > 5 ? "retry with backoff" : "fail fast"}
- **Max Retries**: {Math.ceil(patience / 2)}
- **Thinking Delay**: {techLevel == "novice" ? "2-4s" : "0.5-1s"}

## Test Steps

### Step 1: {step.name}

```yaml
action: {step.action}
validation: {step.success}
checkpoint: {true|false}
maxAttempts: 3
```

**Execution**:
1. Navigate/interact: {detailed action}
2. Wait for: {expected state}
3. Validate: {assertion}
4. Screenshot: {on checkpoint or failure}

**Narration**: "I'm looking for... I expect to see... I'll click on..."

---

## Report Template

```markdown
# Test Execution Report

**Journey**: {name}
**Executed**: {timestamp}
**Duration**: {total time}
**Result**: PASS | FAIL

## Summary

| Step | Status | Duration | Attempts |
|------|--------|----------|----------|
| {name} | ✓/✗ | Xs | N |

## Detailed Results

### {step.name}
- **Status**: {pass/fail}
- **Duration**: {time}
- **Attempts**: {count}
- **Narration**: "{thoughts}"
- **Screenshot**: {path}
- **Error**: {if any}

## Issues Found

1. {issue description}
   - Severity: {critical|major|minor}
   - Step: {step name}
   - Screenshot: {path}

## Recommendations

- {actionable improvement}
```
```
