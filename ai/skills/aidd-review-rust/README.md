# aidd-review-rust

Rust-specific code review criteria for correctness, safety, ownership, and
idiomatic patterns.

## Why

Rust's ownership model and unsafe escape hatches create review-specific
concerns that general code review misses. Systematic checks for unwrap
discipline, lock scopes across await, slice types in APIs, and unsafe
invariant documentation catch bugs that compile but are semantically wrong.

## Usage

Invoke `/aidd-review-rust` when reviewing Rust code. The skill runs grep-based
detection from a checklist, then evaluates six priority areas: safety,
security, ownership, async correctness, type design, and test quality. Every
finding cites file:line with the wrong pattern and the correct fix.

Referenced automatically by `/aidd-review` when Rust code is in the diff.

## When to use

- Reviewing Rust pull requests or diffs
- Auditing Rust code for safety and correctness
- Evaluating Rust code quality before merge
