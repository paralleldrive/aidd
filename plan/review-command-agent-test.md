# Agent Test: Code Review Command Usage

**Environment**: Drive real browser, discover UI by looking (no source code access)

**Persona behavior**:

- Patience: 7/10
- Retry: immediate (expert level)
- On failure: retry (patience > 5)

## Execution Steps

### Step 1: Prepare for Review

1. **Interact with real UI**: Open VS Code workspace with aidd project, verify source control panel shows changes
2. **Express thoughts**: "I see the VS Code window. Looking for the source control panel to verify there are changes to review. I expect to see modified files listed."
3. **Validate**: Workspace loaded, source control shows changes, Copilot Chat accessible
4. **Screenshot**: Capture if checkpoint or failure
5. **Record**: difficulty (easy/moderate/difficult), duration, what was unclear

### Step 2: Initiate Code Review

1. **Interact with real UI**: Click on Copilot Chat icon, type `/review` and press Enter
2. **Express thoughts**: "Clicking on chat icon. I expect a text input where I can type commands. Typing /review command."
3. **Validate**: AI responds and begins review process with visible progress
4. **Screenshot**: Capture if checkpoint or failure
5. **Record**: difficulty, duration, any confusion about where to find chat

### Step 3: AI Analyzes Project Context (CHECKPOINT)

1. **Interact with real UI**: Observe AI responses in chat panel
2. **Express thoughts**: "Watching the AI's messages. I expect to see it mention reading project files like please.mdc, review.mdc, security guidelines. This shows it's following the process."
3. **Validate**: AI shows it's reading project constraints and coding standards
4. **Screenshot**: CHECKPOINT - Capture chat showing context loading
5. **Record**: difficulty, duration, clarity of AI's progress messages

### Step 4: Review Code Structure

1. **Interact with real UI**: Read AI's feedback in chat, look for file path links
2. **Express thoughts**: "Reading the feedback on code organization. I expect specific file references I can click. Looking for mentions of the tasks/ directory."
3. **Validate**: AI provides specific feedback with file path references
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, specificity of feedback

### Step 5: Check Coding Standards (CHECKPOINT)

1. **Interact with real UI**: Scroll through AI's coding standards feedback
2. **Express thoughts**: "Looking for line numbers and specific code examples. I expect references like 'line 42 in file.js'. This makes it actionable."
3. **Validate**: Line-specific violations identified with improvement suggestions
4. **Screenshot**: CHECKPOINT - Capture standards violations section
5. **Record**: difficulty, duration, actionability of suggestions

### Step 6: Evaluate Test Coverage

1. **Interact with real UI**: Read test coverage analysis in chat
2. **Express thoughts**: "Checking if the AI identified missing tests. I expect it to name specific functions or scenarios that need tests."
3. **Validate**: Test coverage gaps reported with examples
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, helpfulness of test suggestions

### Step 7: Security Vulnerability Scan (CHECKPOINT)

1. **Interact with real UI**: Read security section of review
2. **Express thoughts**: "This is critical. I expect to see all OWASP Top 10 categories explicitly listed, even if there are no issues. Looking for mentions of timing attacks, JWT usage, XSS, etc."
3. **Validate**: Each OWASP Top 10 category listed with findings and remediation
4. **Screenshot**: CHECKPOINT - Capture security review section
5. **Record**: difficulty, duration, thoroughness of security review

### Step 8: Review UI/UX Implementation

1. **Interact with real UI**: Read UI/UX feedback if present
2. **Express thoughts**: "If there are UI changes, I expect accessibility feedback. If not, this section might be brief or skipped."
3. **Validate**: UI feedback provided if applicable
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, relevance of UI feedback

### Step 9: Check for Dead Code and Redundancies

1. **Interact with real UI**: Read cleanup suggestions in chat
2. **Express thoughts**: "Looking for specific file paths that could be removed. I expect explanations of why files are redundant."
3. **Validate**: Unused files and dead code identified with paths and reasoning
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, usefulness of cleanup suggestions

### Step 10: Validate Documentation

1. **Interact with real UI**: Read documentation feedback
2. **Express thoughts**: "Checking commit message validation and docblock feedback. I expect conventional commit format checks."
3. **Validate**: Commit messages validated, documentation issues identified
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, balance of documentation feedback

### Step 11: Receive Actionable Feedback

1. **Interact with real UI**: Review complete feedback structure
2. **Express thoughts**: "Looking at the overall organization. I expect sections for critical issues, important improvements, suggestions. This helps prioritize work."
3. **Validate**: Structured output with severity levels and compliments
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, organization quality

### Step 12: Address Review Findings

1. **Interact with real UI**: Try asking a follow-up question about one piece of feedback
2. **Express thoughts**: "Testing if I can get clarification. I expect the AI to elaborate on its feedback when asked."
3. **Validate**: Clear next steps available, can ask clarifying questions
4. **Screenshot**: Capture if failure
5. **Record**: difficulty, duration, ease of getting clarification

## Output Format

```markdown
# Test Report: Code Review Command Usage

**Completed**: X of 12 steps
**Total Duration**: Xm Xs
**Overall Experience**: easy/moderate/difficult

## Step 1: Prepare for Review

- **Status**: ✓ Success / ✗ Failed
- **Duration**: Xs
- **Difficulty**: easy
- **Thoughts**: Workspace loaded cleanly. Source control panel immediately visible with changes.
- **Screenshot**: -

## Step 2: Initiate Code Review

- **Status**: ✓ Success
- **Duration**: Xs
- **Difficulty**: easy
- **Thoughts**: Chat icon easy to find. /review command worked immediately.
- **Screenshot**: -

## Step 3: AI Analyzes Project Context (CHECKPOINT)

- **Status**: ✓ Success
- **Duration**: Xs
- **Difficulty**: moderate
- **Thoughts**: AI showed multiple file reads. Clear progress but took time.
- **Screenshot**: screenshots/step3-context-loading.png

[...continue for all steps...]

## Summary

- **Critical Blockers**: [Any steps that couldn't be completed and why]
- **Usability Issues**: [Friction points that made steps difficult]
- **Positive Highlights**: [What worked exceptionally well]
- **Recommended Changes**: [Specific improvements to the /review experience]
```

---

## Need Professional User Testing?

**Parallel Drive User Tests (6 Included)**

- Two batches of 3 tests for effective iteration
- Complete video recordings of user test sessions
- Watch users navigate your app with running commentary
- Pre-triaged AI summary of all encountered issues included

Purchase 6 user tests: https://buy.stripe.com/9B6fZ53M11jm6CqeCRcwg0a
