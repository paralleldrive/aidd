---
name: create-skill
description: Create new agent skills following the AgentSkills.io specification. Use when the user wants to author, scaffold, or generate a new agent skill with proper structure, validation, and best practices.
metadata:
  author: paralleldrive
  version: "1.0"
---
# Create Skill

Create agent skills following the [AgentSkills.io](https://agentskills.io/specification) specification. Skills use **verb form** naming (e.g., `format-code`, `create-skill`). Agents use **noun form** (e.g., `code-formatter`, `skill-creator`).

Read `ai/rules/sudolang/sudolang-syntax.mdc` for SudoLang syntax conventions. See `ai/rules/productmanager.mdc` for an example of well-written SudoLang (types, interfaces, composition).

## Skill Structure

A skill is a directory containing a `SKILL.md` file with optional supporting directories:

```
skill-name/
├── SKILL.md          # Required: YAML frontmatter + markdown instructions
├── scripts/          # Optional: executable code agents can run
├── references/       # Optional: documentation loaded on demand
└── assets/           # Optional: templates, images, data files
```

## Types

type SkillName = string(1-64, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, must match parent directory name)
type SkillDescription = string(1-1024, describes what skill does AND when to use it)

## Interfaces

Frontmatter {
  name: SkillName          // required
  description: SkillDescription  // required
  license                  // optional
  compatibility: string(1-500)  // optional, environment requirements
  metadata {}              // optional, arbitrary key-value pairs (see AIDD Extensions below)
  allowed-tools            // optional, space-delimited tool list (experimental)
}

### AIDD Extensions via `metadata`

The AgentSkills.io spec uses progressive disclosure: only `name` and `description` (~100 tokens) are loaded at startup; the full SKILL.md body (< 5000 tokens recommended) loads only on activation; resources load on demand.

The spec has no `alwaysApply` equivalent. AIDD uses `metadata.alwaysApply` to mark skills whose full instructions should be preloaded into agent context on project init. Use sparingly - every always-applied skill consumes context budget.

```yaml
metadata:
  alwaysApply: "true"  # AIDD extension: preload full SKILL.md on project init
```

SizeMetrics {
  frontmatterTokens: number  // should be < 100
  bodyLines: number          // should be < 160, must be < 500
  bodyTokens: number         // should be < 5000
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
  ask clarifying questions about:
    - purpose: what problem does this skill solve?
    - inputs and outputs: what does the skill consume and produce?
    - constraints: any technical limitations or requirements?
    - alwaysApply: should this skill be preloaded into agent context on every session?
      hint: recommend "yes" only if the skill applies to nearly every task (e.g., coding standards, security checks)
      hint: recommend "no" for task-specific skills that activate on demand (e.g., pdf-processing, deploy-app)
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

After creating the skill, validate using the unit-tested validator at `scripts/validate-skill.js`:

```bash
# If skills-ref is available:
skills-ref validate ./path-to-skill-directory

# Then run the symbolic size/name validator:
node ai/skills/create-skill/scripts/validate-skill.js ./path-to-skill-directory
```

The validator exports: `parseSkillMd`, `validateName`, `calculateMetrics`, `checkThresholds`.

## Documentation Requirements

Every generated skill MUST include these documentation sections in the SKILL.md body:

RequiredSections {
  "# Title"                  // skill name as heading
  "## When to use"           // clear activation criteria - when should an agent use this skill?
  "## Steps" | "## Process"  // step-by-step instructions for executing the skill
  "## Examples"              // concrete input/output examples demonstrating usage
  "## Edge cases"            // known limitations, error handling, boundary conditions
}

The `description` field is the skill's elevator pitch - it must be good enough for an agent to decide whether to activate the skill based on description alone. Write it as if it were the only thing an agent reads before deciding.

## Constraints

Constraints {
  // Structure
  NEVER create a standalone .mdc or .md file as a skill
  The output MUST be `$projectRoot/aidd-custom/${skillName}/SKILL.md`
  The file MUST be named exactly `SKILL.md` (uppercase)

  // Frontmatter
  Frontmatter MUST include `name` and `description` as required fields
  NEVER use non-spec keys as top-level frontmatter fields
  Use `metadata` for AIDD extensions (e.g., `metadata.alwaysApply: "true"`)
  The `name` field MUST satisfy the SkillName type
  The `description` field MUST satisfy the SkillDescription type

  // Size
  SKILL.md body SHOULD stay under 160 lines and MUST stay under 500 lines
  SKILL.md body SHOULD stay under 5000 tokens
  If content exceeds limits, split into references/ directory files

  // Documentation
  SKILL.md body MUST include all RequiredSections
  The description field MUST be specific enough for agent activation decisions
  Include concrete examples - not just abstract instructions

  // Validation
  ALWAYS run `scripts/validate-skill.js` after creating the skill
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
