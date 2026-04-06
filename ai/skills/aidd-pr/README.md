# aidd-pr

`/aidd-pr` triages pull request review comments, resolves already-addressed threads, and delegates targeted fix prompts to sub-agents via `/aidd-fix`.

## Usage

```
/aidd-pr [PR URL]    — triage comments, resolve addressed threads, and generate /aidd-fix delegation prompts
/aidd-pr delegate    — dispatch the generated prompts to sub-agents and resolve related PR conversations via the GitHub GraphQL API
```

## How it works

1. Uses `gh` to list all open review threads and identify which have already been addressed in code
2. Presents the addressed list for manual approval, then resolves those threads via the GitHub GraphQL API
3. Validates remaining issues against the current source
4. For each confirmed issue, generates a focused `/aidd-fix` delegation prompt — one issue per prompt, targeting the PR branch directly
