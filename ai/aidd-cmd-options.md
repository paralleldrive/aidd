## 📊 Options - Generate Engineering Options Document

Generate an Options Document exploring alternative approaches for engineering decisions.

**Usage:** `/options [feature-description]`

---

## Command Description

Creates a systematic exploration of engineering alternatives before committing to an approach. For each major technical decision, generates 2-4 options with trade-offs.

**Part of:** HLDD workflow (can be used standalone or as part of /hldd)

---

## What It Generates

For each major engineering decision:

### Decision Template

```markdown
### Decision N: [Decision Name]

**Question:** [What needs to be decided?]

**Context:** [Why this decision matters]

**Option A: [Approach Name]**
- **Pros:**
  - [Benefit 1]
  - [Benefit 2]
- **Cons:**
  - [Drawback 1]
  - [Drawback 2]
- **Impact:** [Complexity, timeline, maintenance]
- **Examples:** [Code snippet or reference]

**Option B: [Alternative Approach]**
[Same structure]

**Option C: [Another Alternative]** (if applicable)
[Same structure]

**AI Recommendation:** Option [X]
**Reasoning:** [Why this is suggested]
**Confidence:** [High/Medium/Low]
```

---

## Typical Decisions Generated

1. **State Management:** Props-only vs MobX vs Redux vs React State
2. **Component Architecture:** Presentational vs Container vs Compound
3. **Data Fetching:** REST vs GraphQL vs Proto/gRPC
4. **Testing Strategy:** Unit only vs Unit+Integration vs Full E2E
5. **Styling Approach:** Design system only vs Mixed vs Custom
6. **Performance Strategy:** Lazy loading vs Eager vs Progressive
7. **Error Handling:** Boundary vs Try/catch vs Fallback data
8. **Type Safety:** Strict vs Relaxed vs Runtime validation

---

## Output

**File:** `aidd-planning/options-[feature-name].md`

**Next Steps:**
After reviewing options:
- Run `/decisions` to walk through choices
- Or manually note decisions and run `/hldd` to generate eng-plan

---

## Constraints

Before beginning:
- Read and respect constraints in aidd-always-please.mdc
- Use aidd-core-hldd.mdc for option templates
- Generate 2-4 realistic options per decision
- Include code examples for concrete options
- Provide honest trade-off analysis
- Make recommendations but allow user choice
- Consider project context (existing stack, team skills, timeline)
