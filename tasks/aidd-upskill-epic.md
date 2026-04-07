# aidd-upskill Epic

**Goal**: A skill that guides agents to create and review high-quality AIDD skills.

## Skill Design

- Given an agent is designing a skill, should apply a function framing (`f: Input → Output`) as the primary design lens before committing to structure.
- Given two skills share the same `f`, should extract a shared abstraction rather than duplicating.
- Given a candidate abstraction cannot be named, should not be treated as an abstraction yet.
- Given a skill is being designed or reviewed, should apply the Function Test: name `f`, identify parameters vs defaults, determine CLI vs AI prompt, confirm recomposability.

## Create Pipeline

- Given the create pipeline documented in `ai/skills/aidd-upskill/references/process.md`, should treat `discoverRelatedSkills` and `researchBestPractices` as sub-steps inside `gatherRequirements`, not as separate top-level pipeline stages that would run before those outputs exist.
- Given `/aidd-upskill create [name]` is invoked, should infer requirements from context rather than blocking on user input; any gaps should be stated as explicit assumptions before proceeding.
- Given a plan has been built, should validate it via `/aidd-review` and resolve issues via `/aidd-fix` before drafting — should not await explicit user approval.
- Given a skill is being created, should produce a `README.md` containing what the skill is, why it is useful, and a command reference with usage examples.

## Review Pipeline

- Given `/aidd-upskill review [target]` is invoked, should run all checks and produce a per-check pass/fail table with an overall verdict.
- Given a skill is under review, should scan SKILL.md and all reference files for duplicated information and identify the single source of truth for each.
- Given a skill README is under review, should flag if it is missing, lacks what/why/commands, or contains implementation details or process narratives.

## README Authoring

- Given a skill README is authored, should not contain implementation details, process pipeline descriptions, or internal narratives.

## Validator CLI

- Given `validate-skill` is run against a skill directory, should report name errors and size threshold warnings.
- Given `validate-skill` is executed as the program entry point (including when packaged as a Bun-compiled binary), should run the CLI and validate the target directory instead of treating the script as an imported library only.
- Given the module is loaded as a CLI entry point, should determine `isMain` by calling `resolveIsMainEntry` instead of duplicating its logic inline.
- Given a SKILL.md frontmatter field value contains an inline YAML comment (e.g. `name: aidd-my-skill # comment`), should validate `name` and `description` correctly without treating the comment as part of the value.
- Given `yaml.load` returns a non-object value for degenerate frontmatter (e.g. a bare scalar string), should return an error containing "must be a YAML mapping" without throwing.

## Eval Tests

- Given `runFunctionTest` is applied to a skill description, should correctly name `f`, distinguish parameters from defaults, and reach the correct CLI vs AI prompt verdict.
- Given `deduplicateWithCaveman()` is applied to a SKILL.md and reference file containing duplicated content, should identify the duplicate and name the canonical location.
