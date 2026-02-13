---
name: create-skill
description: Create new agent skills following the AgentSkills.io specification. Use when the user wants to author, scaffold, or generate a new agent skill with proper structure, validation, and best practices.
metadata:
  author: paralleldrive
  version: "1.0"
---
# Create Skill

Create agent skills following the [AgentSkills.io](https://agentskills.io/specification) specification. Skills use **verb form** naming (e.g., `format-code`, `create-skill`). Agents use **noun form** (e.g., `code-formatter`, `skill-creator`).

## SudoLang Reference

Read `ai/rules/sudolang/sudolang-syntax.mdc` for SudoLang syntax conventions. See `ai/rules/productmanager.mdc` for an example of well-written SudoLang (types, interfaces, composition).

Use markdown and natural language primarily. Employ SudoLang for interfaces, type definitions, and function composition where token efficiency matters. Favor symbolic code (JavaScript) over AI inference for deterministic operations.

## Types

type SkillName = string(1-64, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, matches parent directory name)
type SkillDescription = string(1-1024, describes what skill does AND when to use it)
type TokenCount = number // ~4 chars per token estimate

## Interfaces

Frontmatter {
  name: SkillName          // required, must match directory name
  description: SkillDescription  // required
  license                  // optional
  compatibility: string(1-500)  // optional, environment requirements
  metadata {}              // optional, arbitrary key-value pairs (see AIDD Extensions below)
  allowed-tools            // optional, space-delimited tool list (experimental)
}

### AIDD Extensions via `metadata`

The AgentSkills.io spec has no `alwaysApply` equivalent. By default, skills use progressive disclosure: only `name` and `description` are loaded at startup; the full SKILL.md body loads only on activation. The spec's `metadata` field is the designated extension point for custom properties.

AIDD uses `metadata.alwaysApply` to mark skills whose full instructions should be preloaded into agent context on project init, before any user request. Use sparingly - every always-applied skill consumes context budget.

```yaml
metadata:
  alwaysApply: "true"  # AIDD extension: preload full SKILL.md on project init
```

Skill {
  ${skillName}/
    SKILL.md               // required: Frontmatter + markdown body
    scripts/               // optional: executable code
    references/            // optional: documentation loaded on demand
    assets/                // optional: templates, images, data files
}

SizeMetrics {
  frontmatterTokens: TokenCount  // should be < 100
  bodyLines: number              // should be < 160, must be < 500
  bodyTokens: TokenCount         // should be < 5000
}

SkillPlan {
  name: SkillName
  purpose: SkillDescription
  alwaysApply: boolean     // should this skill preload on project init?
  relatedSkills[]          // existing skills found in discovery
  bestPractices[]          // findings from web research
  proposedSections[]       // planned SKILL.md structure
  optionalDirs: ["scripts" | "references" | "assets"]
  sizeEstimate: SizeMetrics
}

## Progressive Disclosure

Metadata (~100 tokens) => loaded at startup for all skills
Instructions (< 5000 tokens) => loaded when skill is activated
Resources (as needed) => loaded only when required

## Process

createSkill(userRequest) {
  gatherRequirements
    |> discoverRelatedSkills
    |> researchBestPractices
    |> nameSkill
    |> buildPlan
    |> presentPlan
    |> awaitApproval
    |> draftSkillMd
    |> writeSkill
    |> validate
    |> reportMetrics
}

gatherRequirements(userRequest) {
  ask clarifying questions about purpose, inputs, outputs, and constraints
}

discoverRelatedSkills(skillTopic) {
  searchPaths = ["$projectRoot/ai/", "$projectRoot/aidd-custom/"]
  scan for SKILL.md, .mdc, and .md files
  read frontmatter descriptions
  identify overlapping or complementary skills
  report: related skills, how to leverage them, overlap to avoid
}

researchBestPractices(skillTopic) {
  use web search to find best practices for $skillTopic
  summarize key findings relevant to skill authoring
}

nameSkill(topic) {
  use verb form (e.g., `format-code`, `generate-report`)
  validate against SkillName type constraints
}

buildPlan() => SkillPlan

presentPlan(plan: SkillPlan) {
  show the user the full SkillPlan
  ask if any changes are required
  await explicit user approval
}

draftSkillMd(plan: SkillPlan) {
  write Frontmatter with name + description (required), optional fields as needed
  if (plan.alwaysApply) add `metadata.alwaysApply: "true"`
  write body with required documentation sections (see Documentation Requirements below)
}

writeSkill(skillMd) {
  write to `$projectRoot/aidd-custom/${skillName}/SKILL.md`
  create optional directories (scripts/, references/, assets/) if planned
}

## Validation

After creating the skill, run validation and report size metrics:

```javascript
// 1. Run: skills-ref validate ./path-to-skill-directory
// 2. Then compute and report size metrics:

const fs = require("fs");
const path = require("path");
const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");
const fmMatch = skillMd.match(/^---\n([\s\S]*?)\n---/);
const frontmatter = fmMatch ? fmMatch[1] : "";
const body = fmMatch ? skillMd.slice(fmMatch[0].length).trim() : skillMd;

// Validate name field
const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
const name = nameMatch ? nameMatch[1].trim() : "";
const nameErrors = [];
if (name.length < 1 || name.length > 64) nameErrors.push("Name must be 1-64 characters");
if (/[^a-z0-9-]/.test(name)) nameErrors.push("Name must be lowercase alphanumeric + hyphens only");
if (/^-|-$/.test(name)) nameErrors.push("Name must not start or end with hyphen");
if (/--/.test(name)) nameErrors.push("Name must not contain consecutive hyphens");
if (name !== path.basename(skillDir)) nameErrors.push("Name must match directory name");

const metrics = {
  frontmatterTokens: Math.ceil(frontmatter.length / 4),
  bodyLines: body.split("\n").length,
  bodyTokens: Math.ceil(body.length / 4),
};

const warnings = [];
if (metrics.frontmatterTokens >= 100)
  warnings.push("Frontmatter exceeds 100 token guideline");
if (metrics.bodyLines >= 160)
  warnings.push("Body exceeds 160 line guideline");
if (metrics.bodyLines >= 500)
  warnings.push("Body exceeds 500 line spec limit - split into reference files");
if (metrics.bodyTokens >= 5000)
  warnings.push("Body exceeds 5000 token spec guideline");

console.log("Name validation:", nameErrors.length ? nameErrors : "PASS");
console.log("Size metrics:", metrics);
console.log(warnings.length ? "Warnings: " + warnings.join(", ") : "All size checks passed");
```

## Documentation Requirements

Every generated skill MUST include these documentation sections in the SKILL.md body:

RequiredSections {
  "# Title"                  // skill name as heading
  "## When to use"           // clear activation criteria - when should an agent use this skill?
  "## Steps" | "## Process"  // step-by-step instructions for executing the skill
  "## Examples"              // concrete input/output examples demonstrating usage
  "## Edge cases"            // known limitations, error handling, boundary conditions
}

The `description` field in frontmatter is the skill's elevator pitch - it must be good enough for an agent to decide whether to activate the skill based on description alone (progressive disclosure). Write it as if it were the only thing an agent reads before deciding.

## Spec Compliance Constraints

Every generated skill MUST pass all of these checks:

Constraints {
  // Structure: skills are DIRECTORIES, not standalone files
  NEVER create a standalone .mdc or .md file as a skill
  The output MUST be `$projectRoot/aidd-custom/${skillName}/SKILL.md`
  The file MUST be named exactly `SKILL.md` (uppercase)

  // Frontmatter: use AgentSkills.io spec fields only
  Frontmatter MUST include `name` and `description` as required fields
  NEVER use `alwaysApply`, `globs`, or other non-spec keys as top-level frontmatter fields
  Use `metadata` for AIDD extensions (e.g., `metadata.alwaysApply: "true"`)
  The `name` field MUST satisfy the SkillName type constraints
  The `description` field MUST satisfy the SkillDescription type constraints

  // Size: respect progressive disclosure thresholds
  Frontmatter metadata MUST stay under ~100 tokens
  SKILL.md body SHOULD stay under 160 lines and MUST stay under 500 lines
  SKILL.md body SHOULD stay under 5000 tokens
  If content exceeds limits, split into references/ directory files

  // Documentation: every skill must be well-documented
  SKILL.md body MUST include all RequiredSections
  The description field MUST be specific enough for agent activation decisions
  Include concrete examples - not just abstract instructions

  // Validation: always validate before reporting success
  ALWAYS run the symbolic JavaScript validator after creating the skill
  ALWAYS run `skills-ref validate` if available
  ALWAYS report size metrics and any warnings to the user
}

## Example SKILL.md

```markdown
---
name: format-code
description: Format source code files according to project style guides and conventions. Use when code needs formatting, linting fixes, style consistency checks, or when a user mentions "format", "lint", or "prettier".
metadata:
  author: my-org
  version: "1.0"
  alwaysApply: "true"
---

# Format Code

Format source code according to project conventions and style guides.

## When to use

Use this skill when:
- Code needs formatting or linting fixes
- A new file is created and needs style consistency
- The user asks for style or formatting help

## Steps

1. Detect the project's formatter configuration (prettier, biome, eslint, etc.)
2. Identify files that need formatting
3. Apply formatting rules
4. Report changes made

## Examples

Given a project with `.prettierrc`, run: `npx prettier --write "src/**/*.ts"`
Given a project with `biome.json`, run: `npx @biomejs/biome format --write`

## Edge cases

- If no formatter config exists, ask the user which style to use
- For mixed-language projects, apply per-language formatters
- If formatter conflicts with linter, prioritize linter configuration
```

Commands {
  /create-skill - create a new agent skill following the AgentSkills.io specification
}
