# Skill Creation Process

## Pipeline

```
createSkill(userRequest) {
  gatherRequirements
    |> nameSkill
    |> think() --compact
    |> buildPlan
    |> presentPlan
    |> draftSkillMd
    |> writeSkill
    |> writeReadme
    |> validate
    |> reportMetrics
}
```

## Steps

**gatherRequirements(userRequest)**
1. discoverRelatedSkills — search `$projectRoot/ai/` and `$projectRoot/aidd-custom/` for SKILL.md, `.mdc`, `.md` files; read frontmatter descriptions; identify overlap or complementary skills
2. researchBestPractices — use web search to find best practices for the domain; summarize findings
3. Infer requirements from the above context. Do not ask clarifying questions or block on user input. Use a judge to evaluate completeness: yes → proceed; no → state gaps as explicit assumptions and proceed.

Infer answers to these questions from context rather than asking the user:
- What problem does this skill solve?
- What are its inputs and outputs?
- Any technical constraints or requirements?
- Should it `alwaysApply`? (recommend yes only if it applies to nearly every task)

**nameSkill(topic)**
- Use verb or role-based noun form (e.g., `aidd-format-code`, `aidd-upskill`)
- Validate against `SkillName` type constraints

**buildPlan() => SkillPlan**
Produce a `SkillPlan` struct (see `references/types.md`).

**presentPlan(plan: SkillPlan)**
Show the full plan, then run a self-validating quality gate — do not await user approval:
1. Run `/aidd-review` on the plan
2. Issues found => run `/aidd-fix` loop until all issues are resolved
3. Proceed to `draftSkillMd`

**draftSkillMd(plan: SkillPlan)**
- Write frontmatter: `name` + `description` required; add `metadata.alwaysApply` if needed
- Write body with all `RequiredSections`
- If body will exceed the line threshold (run `validate-skill` to check), extract content to `references/` and use `import $referenceFile`

**writeSkill(skillMd)**
- Write to `$projectRoot/aidd-custom/skills/${skillName}/SKILL.md`
- Create `scripts/`, `references/`, or `assets/` directories only if planned

**writeReadme(skillMd)**
- Write `README.md` in the skill directory
- Include: what the skill is, why it is useful, command reference with usage examples
- Exclude: implementation details, process narratives, pipeline descriptions

**validate**
```bash
ai/skills/aidd-upskill/scripts/validate-skill ./path-to-skill-directory
# If skills-ref is available:
skills-ref validate ./path-to-skill-directory
```

**reportMetrics**
Report `SizeMetrics` and any threshold warnings to the user.

## Skill Review Process

```
reviewSkill(target) {
  readSkill(target)
    |> runFunctionTest
    |> checkRequiredSections
    |> checkSizeMetrics
    |> checkCommandSeparation
    |> checkReadme
    |> deduplicate()
    |> think() --compact
    |> reportFindings
}
```

**runFunctionTest** — apply the 5-question Function Test from SKILL.md  
**checkRequiredSections** — verify all `RequiredSections` are present  
**checkSizeMetrics** — run `validate-skill` and report warnings  
**checkCommandSeparation** — verify no command mixes thinking and side effects
**checkReadme** — verify README.md exists and contains what/why/commands; flag if it contains implementation details or process narratives
**deduplicate()** — find every instance of repeated information across SKILL.md and its references; flag each duplicate and identify where the single source of truth should live; use `think() --compact` to reason about the canonical location  
**think() --compact** — synthesize all findings into a holistic judgment before rendering the verdict (uses the RTC think() function from `aidd-please`); independently testable as a pure thinking stage  
**reportFindings** — produce a per-check pass/fail table (one row per check: runFunctionTest, checkRequiredSections, checkSizeMetrics, checkCommandSeparation, checkReadme, deduplicate) with columns for check name, result (✅/⚠️/❌), and detail; conclude with an overall verdict
