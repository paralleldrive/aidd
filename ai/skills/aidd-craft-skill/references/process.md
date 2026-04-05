# Skill Creation Process

## Pipeline

```
createSkill(userRequest) {
  gatherRequirements
    |> discoverRelatedSkills
    |> researchBestPractices
    |> nameSkill
    |> caveman()
    |> buildPlan
    |> presentPlan
    |> draftSkillMd
    |> writeSkill
    |> validate
    |> reportMetrics
}
```

## Steps

**gatherRequirements(userRequest)**
Ask clarifying questions:
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
- Use verb or role-based noun form (e.g., `aidd-format-code`, `aidd-craft-skill`)
- Validate against `SkillName` type constraints

**buildPlan() => SkillPlan**
Produce a `SkillPlan` struct (see `references/types.md`).

**presentPlan(plan: SkillPlan)**
Show the full plan; confirm alignment before drafting.

**draftSkillMd(plan: SkillPlan)**
- Write frontmatter: `name` + `description` required; add `metadata.alwaysApply` if needed
- Write body with all `RequiredSections`
- If body will exceed 150 LoC, extract content to `references/` and use `import $referenceFile`

**writeSkill(skillMd)**
- Write to `$projectRoot/aidd-custom/${skillName}/SKILL.md`
- Create `scripts/`, `references/`, or `assets/` directories only if planned

**validate**
```bash
node ai/skills/create-skill/scripts/validate-skill.js ./path-to-skill-directory
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
    |> deduplicateWithCaveman()
    |> caveman()
    |> reportFindings
}
```

**runFunctionTest** — apply the 5-question Function Test from SKILL.md  
**checkRequiredSections** — verify all `RequiredSections` are present  
**checkSizeMetrics** — run `validate-skill.js` and report warnings  
**checkCommandSeparation** — verify no command mixes thinking and side effects  
**deduplicateWithCaveman()** — find every instance of repeated information across SKILL.md and its references; flag each duplicate and identify where the single source of truth should live  
**reportFindings** — list issues, suggestions, and a pass/fail verdict
