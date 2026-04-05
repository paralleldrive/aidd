# Types & Interfaces

## Types

```
type SkillName = string(
  1-64 chars,
  lowercase alphanumeric + hyphens,
  no leading/trailing/consecutive hyphens,
  must match parent directory name,
  prefix: "aidd-",
  verb or role-based noun
)

type SkillDescription = string(
  1-1024 chars,
  describes what the skill does AND when to use it,
  precise enough for an agent to activate on description alone
)
```

## SizeMetrics

```
SizeMetrics {
  frontmatterTokens: number  // should be < 100
  bodyLines: number          // should be < 160, must be < 500
  bodyTokens: number         // should be < 5000
}
```

## SkillPlan

```
SkillPlan {
  name: SkillName
  purpose: SkillDescription
  alwaysApply: boolean       // preload on project init? Use sparingly.
  relatedSkills[]            // existing skills found during discovery
  bestPractices[]            // findings from research
  proposedSections[]         // planned SKILL.md structure
  optionalDirs: ["scripts" | "references" | "assets"]
  sizeEstimate: SizeMetrics
}
```

## Frontmatter

```
Frontmatter {
  name: SkillName                       // required
  description: SkillDescription         // required
  license                               // optional
  compatibility: string(1-500)          // optional, environment requirements
  metadata {}                           // optional, AIDD extensions
  allowed-tools                         // optional, space-delimited tool list
}
```

### AIDD Extensions via `metadata`

`metadata.alwaysApply: "true"` preloads the full SKILL.md on project init.
Use only for skills that apply to nearly every task (e.g., coding standards).
Task-specific skills should activate on demand, not preload.

## RequiredSections

Every generated SKILL.md body must include:

```
RequiredSections {
  "# Title"                  // skill name as heading
  "## When to use"           // clear activation criteria
  "## Steps" | "## Process"  // ordered execution instructions
  "## Examples"              // concrete input/output examples
  "## Edge cases"            // limitations, error handling, boundary conditions
}
```
