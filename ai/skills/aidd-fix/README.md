# aidd-fix

Guides a disciplined, test-driven process for fixing bugs and implementing
code review feedback — one step at a time, with no scope creep.

## Why

Unstructured fixes skip root-cause analysis and add tests after the fact (or
not at all). `/aidd-fix` enforces the opposite: confirm the bug, write a
failing test, then write the minimum code to make it pass.

## Usage

Invoke `/aidd-fix` with the bug report or review feedback. The skill walks
through six steps: gain context, document the requirement in the epic, write a
failing test, implement the fix, self-review, then commit.

The failing test is not optional — if it passes before any implementation, the
bug is already fixed or the test is wrong.

## When to use

- A bug has been reported and needs investigation
- A failing test needs root cause identified and resolved
- Code review feedback requires a code change
