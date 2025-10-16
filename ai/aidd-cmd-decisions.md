## 🎯 Decisions - Interactive Decision Walkthrough

Walk through engineering options interactively, get user decisions, and record rationale.

**Usage:** `/decisions`

**Prerequisites:** Options Document must exist (created via `/options` or `/hldd`)

---

## Command Description

Guides user through each decision in the Options Document with:
- Context and explanation
- AI recommendation with reasoning
- User choice
- Rationale capture
- Dependency checking

**Part of:** HLDD workflow (bridges options → eng-plan)

---

## Decision Walkthrough Flow

For each decision in Options Document:

```
Present Decision N of M
  ↓
Show options with trade-offs
  ↓
Present AI recommendation
  ↓
User chooses option [1-4]
  ↓
Capture user rationale (optional)
  ↓
Check if choice affects other decisions
  ↓
Record decision
  ↓
Move to next decision
```

---

## Interactive Format

```
🎯 Decision 1 of 5: Component State Management

**Question:** How should AppCollectionCard manage state?

**Your Options:**

[ 1 ] Props-only (Presentational)
      ✅ Simple, testable, reusable
      ❌ Limited interactivity
      Impact: Low complexity, fast implementation

[ 2 ] MobX Store
      ✅ Reactive updates, local state management
      ❌ More complex, additional testing
      Impact: Medium complexity, +2 hours

[ 3 ] React useState
      ✅ Built-in, simple for local state
      ❌ Not integrated with app state system
      Impact: Low complexity, non-standard for project

💡 AI Recommendation: [1] Props-only
   Reasoning: Card displays data, parent handles interactions
   Confidence: High

Which option do you choose? (1-3)
```

---

**User types:** `1`

**AI responds:**
```
✅ Decision 1: Props-only selected

Would you like to add rationale for this decision? [y/n]
(This helps document why choices were made)
```

---

**User types:** `y - fits our existing pattern`

**AI responds:**
```
✅ Recorded: "Fits our existing pattern"

📝 Decisions so far: 1/5 complete

Moving to Decision 2...
```

---

## Decision Recording

**Format:**
```yaml
decisions:
  - id: 1
    question: "Component State Management"
    chosen: "Props-only (Presentational)"
    rationale: "Fits our existing pattern"
    alternatives_considered: ["MobX Store", "React useState"]
    impact: "Low complexity, fast implementation"
    dependencies: []
    
  - id: 2
    question: "Data Fetching Strategy"
    chosen: "CMS Proto"
    rationale: "Integrates with existing CMS infrastructure"
    alternatives_considered: ["REST API", "GraphQL"]
    impact: "Requires proto registration, +1 day"
    dependencies: [1]
```

---

## After All Decisions

**AI presents:**
```
🎉 All Decisions Made! (5/5)

**Your Choices:**
1. State Management → Props-only
2. Data Fetching → CMS Proto
3. Testing → Standard coverage
4. Design System → Easel exclusive
5. Performance → Lazy loading

Ready to generate Engineering Plan based on these decisions?

[ 1 ] ✅ Yes - Generate aidd-eng-plan.md
[ 2 ] 🔄 Review decisions
[ 3 ] ✏️  Change a decision
[ 4 ] 💾 Save decisions only (skip eng-plan)
```

---

## Output

**File:** `aidd-planning/decisions-[feature-name].yaml`

**Next Step:** Automatically generates aidd-eng-plan.md (or user can run `/hldd` to complete)

---

## Constraints

Before beginning:
- Read and respect constraints in aidd-always-please.mdc
- Use aidd-core-hldd.mdc for decision logic
- Require Options Document to exist first
- Present one decision at a time
- Allow back navigation to change previous decisions
- Capture rationale for each decision
- Check dependencies between decisions
- Offer to generate eng-plan after all decisions made
- Save decisions even if user doesn't proceed to eng-plan
