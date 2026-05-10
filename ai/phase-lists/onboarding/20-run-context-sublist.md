# Run context sub-list

This phase **delegates** to a different phase-list. Perform the nested run, then summarize.

## Steps

1. Run the **same** execution skill on the **context** list. From repo root, with outer depth `D` (this onboarding list is normally `D=0`), invoke:

   `/aidd-phase-list --list ai/phase-lists/context --depth 1 --ancestor-paths ai/phase-lists/onboarding`

   If you were already nested at depth `D>0`, use `--depth <D+1>` and **append** the current list directory to `--ancestor-paths` using `:` (colon), e.g. `ai/phase-lists/onboarding:ai/phase-lists/context`.

2. Wait until that nested run completes (including its final `[phase-list d=…] run finished` line in the assistant transcript).

3. Return a **one-paragraph** outcome for the parent phase summary describing what the context list accomplished.
