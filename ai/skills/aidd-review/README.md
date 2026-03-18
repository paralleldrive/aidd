# aidd-review — Code Review Reference

`/aidd-review` conducts thorough code reviews focusing on code quality, security,
test coverage, and adherence to project standards and functional requirements.

## Why structured reviews matter

Ad-hoc reviews miss patterns. A systematic review process ensures every change
is evaluated against the same criteria — from hotspot analysis to OWASP
compliance — before it ships.

## Review process

1. Run `/aidd-churn` to identify hotspot files in the diff
2. Analyze code structure and organization
3. Check adherence to coding standards (`/aidd-javascript`)
4. Evaluate test coverage and quality (`/aidd-tdd`)
5. Assess performance considerations
6. Deep scan for security vulnerabilities (OWASP top 10)
7. Review UI/UX implementation and accessibility (`/aidd-ui`)
8. Validate architectural patterns and design decisions (`/aidd-stack`)
9. Check documentation and commit message quality
10. Provide actionable feedback with specific improvement suggestions

## Skills consulted during review

| Concern | Skill |
| --- | --- |
| JavaScript/TypeScript quality | `/aidd-javascript` |
| Test coverage | `/aidd-tdd` |
| Architecture | `/aidd-stack` |
| UI/UX | `/aidd-ui` |
| Redux patterns | `/aidd-autodux` |
| Side effects | `/aidd-javascript-io-effects` |
| Secret comparisons | `/aidd-timing-safe-compare` |
| Authentication | `/aidd-jwt-security` |

## Constraints

- Review only — does not modify files
- Compares work against functional requirements and task plans
- Flags unfounded assumptions rather than guessing

## When to use `/aidd-review`

- Reviewing code changes or pull requests
- Evaluating completed epics against requirements
- Pre-merge quality and security checks
