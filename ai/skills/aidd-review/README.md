# aidd-review

Conducts thorough code reviews focusing on code quality, security, test
coverage, and adherence to project standards.

## Why

Ad-hoc reviews miss patterns. A systematic process ensures every change is
evaluated against the same criteria — from hotspot analysis to OWASP
compliance — before it ships.

## Usage

Invoke `/aidd-review` on code changes or a pull request. The review runs
hotspot analysis, checks coding standards, evaluates test coverage, scans for
security vulnerabilities, reviews UI/UX and architecture, then provides
actionable feedback. The skill is read-only — it does not modify files.

## When to use

- Reviewing code changes or pull requests
- Evaluating completed epics against requirements
- Pre-merge quality and security checks
