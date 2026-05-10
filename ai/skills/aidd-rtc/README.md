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
/rtc [prompt]
```

Run RTC on the given prompt (or the current task context). The agent works
through the full reflective sequence and ends with a clear, user-facing
response.

```
/rtc --compact [prompt]
```

Dense internal reasoning: minimal tokens per thinking step, with explicit
causality where it helps, then a full natural-language answer at the end.
Suited when RTC output feeds another step (e.g. review or planning) rather
than being shown directly to the user.

```
/rtc --depth N [prompt]
```

Controls how much detail appears in each step (`N` from 1–10; deeper reasoning, more bullets per thinking stage, deeper explanations in output). Use when you need deeper thinking and more detailed output.
