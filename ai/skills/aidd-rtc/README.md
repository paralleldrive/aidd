# aidd-rtc

Reflective Thought Composition (RTC) — a structured way for an agent to think
through a problem before answering: clarify the ask, surface alternatives,
stress-test assumptions, and compare trade-offs so the final reply is grounded.
Use it when the quality of reasoning matters more than answering in one shot.

## Why

Fast answers can miss edge cases, weak assumptions, or better alternatives.
RTC slows the loop on purpose so trade-offs and risks surface before a final
reply — useful for design decisions, reviews, planning, and any task where
getting the reasoning right reduces rework.

## Commands

```
/aidd-rtc [prompt]
```

Run RTC on the given prompt (or the current task context). The agent works
through the full reflective sequence and ends with a clear, user-facing
response.

```
/aidd-rtc --compact [prompt]
```

Dense internal reasoning: minimal tokens per thinking step, with explicit
causality where it helps, then a full natural-language answer at the end.
Suited when RTC output feeds another step (e.g. review or planning) rather
than being shown directly to the user.

```
/aidd-rtc --depth N [prompt]
```

Controls how much detail appears in each step (`N` from 1–10; higher = more
bullets per stage). Use when you want the visible thinking to carry more
explanation.

```
/aidd-rtc --compact --depth N [prompt]
```

Combines compact internal reasoning with a chosen response density for the
stages that are surfaced.

## When to use

- Complex decisions where assumptions and alternatives need to be challenged
- Design or architecture evaluation before committing to an approach
- Deep analysis (risk, security, product trade-offs) where conclusions should
  follow from explicit reasoning
- Any workflow that benefits from a structured “think first, then answer”
  pass
