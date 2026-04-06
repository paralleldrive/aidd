# Skill Creation Process

## Pipeline

```
createSkill(userRequest) {
  gatherRequirements(userRequest) {
    infer requirements from userRequest + discoverRelatedSkills + researchBestPractices
    judge: are the inferred requirements complete and unambiguous?
      yes => proceed
      no => state assumptions explicitly and proceed
  }
    |> discoverRelatedSkills
    |> researchBestPractices
    |> nameSkill
    |> caveman()
    |> buildPlan
    |> presentPlan(plan: SkillPlan) {
         run /aidd-review on the plan
         issues found => run /aidd-fix loop until resolved
         proceed to draftSkillMd
       }
    |> draftSkillMd
    |> writeSkill
    |> writeReadme
    |> validate
    |> reportMetrics
}
```

## Steps

**gatherRequirements(userRequest)**
Infer requirements from the user request, related skills found during discovery, and research into best practices. Do not ask clarifying questions or block on user input. Instead, use a judge to evaluate the inferred requirements:
- judge: are the inferred requirements complete and unambiguous enough to proceed?
  - yes => proceed
  - no => state the gaps as explicit assumptions and proceed

Infer answers to these questions from context rather than asking the user:
- What problem does this skill solve?
- What are its inputs and outputs?
- Any technical constraints or requirements?
- Should it `alwaysApply`? (recommend yes only if it applies to nearly every task)

**discoverRelatedSkills(skillTopic)**
- Search `$projectRoot/ai/` and `$projectRoot/aidd-custom/` for SKILL.md, `.mdc`, `.md` files
- Read frontmatter descriptions
- Identify overlap or complementary skills to reference

**researchBestPractices(skillTopic)**
- Use web search to find best practices for the domain
- Summarize findings relevant to skill authoring

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
- Write to `$projectRoot/aidd-custom/${skillName}/SKILL.md`
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
    |> deduplicateWithCaveman()
    |> caveman()
    |> reportFindings
}
```

**runFunctionTest** — apply the 5-question Function Test from SKILL.md  
**checkRequiredSections** — verify all `RequiredSections` are present  
**checkSizeMetrics** — run `validate-skill` and report warnings  
**checkCommandSeparation** — verify no command mixes thinking and side effects
**checkReadme** — verify README.md exists and contains what/why/commands; flag if it contains implementation details or process narratives
**deduplicateWithCaveman()** — find every instance of repeated information across SKILL.md and its references; flag each duplicate and identify where the single source of truth should live  
**reportFindings** — list issues, suggestions, and a pass/fail verdict
