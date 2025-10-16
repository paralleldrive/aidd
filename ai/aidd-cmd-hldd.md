## 📐 HLDD - High Level Design Doc

Create the engineering plan (aidd-eng-plan.md) through a systematic design process with options analysis and decision-making.

**Usage:** `/hldd [feature-description]`

**Aliases:** `/design`, `/plan-feature`

---

## Command Description

Creates aidd-planning/aidd-eng-plan.md through a three-phase process:

**Phase 1: Options Document** - Generate alternatives and trade-offs for each major engineering decision
**Phase 2: Decision Making** - Walk through options, get user decisions with AI recommendations  
**Phase 3: Engineering Plan** - Synthesize decisions into comprehensive implementation plan

**Workflow:**
```
/hldd [description]
  ↓
Generate Options Document (or /options)
  ↓
User reviews alternatives
  ↓
Decision Walkthrough (or /decisions)
  ↓
User makes decisions with AI guidance
  ↓
Generate aidd-eng-plan.md
  ↓
Present for approval
```

---

## Why This Approach

**Problem:** Jumping directly to implementation plan can miss better alternatives

**Solution:** Systematic exploration of options before committing to approach

**Benefits:**
- Surfaces trade-offs early
- Documents why decisions were made
- Enables stakeholder discussion
- Reduces rework from wrong approach
- Creates decision record for future reference

---

## Options Document

**What it includes:**

For each major engineering decision:
- **Question** - What decision needs to be made?
- **Options** - 2-4 alternative approaches
- **Trade-offs** - Pros/cons of each option
- **Recommendation** - AI's suggested approach with reasoning
- **Impact** - How this affects timeline, complexity, maintenance

**Example decision:**
```markdown
### Decision 1: Component State Management

**Question:** How should AppCollectionCard manage state?

**Option A: Props-only (Presentational)**
- Pros: Simple, testable, reusable
- Cons: Limited interactivity, parent handles all state
- Impact: Low complexity, fast implementation

**Option B: MobX Store**
- Pros: Reactive updates, local state management
- Cons: More complex, additional testing needed
- Impact: Medium complexity, +2 hours

**Option C: React useState**  
- Pros: Built-in, simple for local state
- Cons: Not integrated with app state system
- Impact: Low complexity, non-standard for project

**Recommendation:** Option A - Fits presentational component pattern
**Rationale:** Card displays data, parent handles interactions
```

---

## Decisions Document

**What it includes:**

For each option from Options Document:
- AI presents the decision with context
- AI recommends an option with reasoning
- User makes choice
- Decision recorded with rationale
- Dependencies and implications noted

**Output:** Decisions recorded for eng-plan generation

---

## Engineering Plan Document

**What it includes:**

Based on user decisions, creates comprehensive plan with:
- **Overview** - Feature summary, scope, assumptions
- **Architecture** - System design based on decisions
- **Phases** - Implementation phases with dependencies
- **Tasks** - High-level task breakdown (detailed tasks come later via /task)
- **Success Metrics** - Measurable outcomes
- **Risks & Mitigation** - Identified risks with mitigation strategies
- **Timeline** - Estimated effort per phase
- **Decision Record** - Documents which options were chosen and why

---

## Implementation

Uses aidd-core-hldd.mdc for:
- Options generation templates
- Decision walkthrough logic
- Engineering plan synthesis
- Trade-off analysis

---

## Constraints

Before beginning:
- Read and respect constraints in aidd-always-please.mdc
- Use aidd-core-hldd.mdc for templates and logic
- Generate options before asking for decisions
- Document rationale for each decision
- Create eng-plan only after all decisions made
- Present plan for user approval before saving
- Save to aidd-planning/aidd-eng-plan.md

---

## Related Commands

- `/options` - Generate Options Document only
- `/decisions` - Walk through decisions (requires Options Document)
- `/hldd` - Complete workflow (options → decisions → eng-plan)

---

## Example Usage

**Quick start:**
```
/hldd Add video collections to marketplace
```

**Step-by-step:**
```
/options Add video collections to marketplace
[Review options]

/decisions
[Make choices]

[AI generates eng-plan automatically]
```

---

## Integration with /task

After creating eng-plan with /hldd:
- eng-plan contains high-level phases and tasks
- Use /task to create detailed task definitions
- Each /task references eng-plan for context
- Tasks implement phases from eng-plan

**Flow:**
```
/hldd → aidd-eng-plan.md (strategic)
  ↓
/task → task-1.md (tactical)
/task → task-2.md
  ↓
/execute → implementation
```
