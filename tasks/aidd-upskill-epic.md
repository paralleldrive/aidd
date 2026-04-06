# aidd-upskill Epic

**Goal**: A skill that guides agents to create and review high-quality AIDD skills.

## Skill Design

- Given an agent is designing a skill, should apply a function framing (`f: Input → Output`) as the primary design lens before committing to structure.
- Given two skills share the same `f`, should extract a shared abstraction rather than duplicating.
- Given a candidate abstraction cannot be named, should not be treated as an abstraction yet.
- Given a skill is being designed or reviewed, should apply the Function Test: name `f`, identify parameters vs defaults, determine CLI vs AI prompt, confirm recomposability.

## Create Pipeline

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

## Eval Tests

- Given `runFunctionTest` is applied to a skill description, should correctly name `f`, distinguish parameters from defaults, and reach the correct CLI vs AI prompt verdict.
- Given `deduplicateWithCaveman()` is applied to a SKILL.md and reference file containing duplicated content, should identify the duplicate and name the canonical location.
