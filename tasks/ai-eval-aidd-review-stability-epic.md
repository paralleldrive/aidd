# AI eval aidd-review stability epic

**Epic goal**: Keep `review-skill-test.sudo` expectations satisfiable by clarifying review guidance so agent runs are less flaky on fixture code.

**Status**: In progress (skill clarity + unit contract tests landed; `test:ai-eval` remains stochastic)

## Requirements

- Given `ai-evals/aidd-review/fixtures/utils.js` (pure helpers with parameter defaults and secret comparison via SHA3-256), a `/review` aligned with repository skills should not report major or Critical security violations solely for comparing SHA3-256 digests with `===`.
- Given code that hashes both candidate and stored secrets with SHA3-256 (including through a small named helper around `createHash`), reviewers should recognize that pattern as correct hash-before-compare and should not flag it as raw timing-unsafe secret comparison.
