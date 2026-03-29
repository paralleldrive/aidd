# CI AI eval Claude token epic

**Status**: In progress  
**Goal**: Keep the `ai-eval` GitHub Actions job green when `npm test` passes but the Claude OAuth token is set yet unusable (authentication or quota failure).

---

## Requirements

- Given `CLAUDE_CODE_OAUTH_TOKEN` is unset or empty in CI, should skip AI prompt evaluations and should not fail the `ai-eval` job.
- Given `CLAUDE_CODE_OAUTH_TOKEN` is set but a minimal Claude Code probe fails (for example invalid credentials or quota or rate limits), should skip AI prompt evaluations and should not fail the `ai-eval` job, matching the observable outcome when the secret is unset.
