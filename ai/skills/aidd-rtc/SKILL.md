---
name: aidd-rtc
description: Reflective Thought Composition. Structured thinking pipeline for complex decisions, design evaluation, and deep analysis. Use when quality of reasoning matters more than speed of response.
---

# aidd-rtc

Reflective Thought Composition (RTC) — a structured thinking pipeline that shows work at each stage before responding.

Commands {
  /aidd-rtc [--caveman] [--depth N] — run the RTC pipeline; output reasoning at each stage
}

Options {
  --caveman  Think like Caveman til Respond. Respond like a human.
  --depth -d [1..10]  Response density. 1 = a few words per step, 10 = several bullet points per step. Default: 5.
}

## Pipeline

```
fn think(input, options) {
  show work:
    🎯 restate |> 💡 ideate |> 🪞 ReflectCriticallyFindYourFlaws |>
    🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond
}
```

## When to use each option

```
(thinking itself is the goal — improving reasoning quality) => /aidd-rtc --caveman
(communicating depth to the user is the goal)              => /aidd-rtc --depth N
(both)                                                     => /aidd-rtc --caveman --depth N
```

`--caveman` is for internal reasoning passes where the output feeds another step, not directly to the user. It primes the model to think plainly and without polish until the final `💬 respond` stage.

## Stages

**🎯 restate** — Restate the problem in your own words. Surface any ambiguity.
**💡 ideate** — Generate candidate approaches, options, or observations without filtering.
**🪞 ReflectCriticallyFindYourFlaws** — Attack your own ideation. Find the weakest assumptions, the missing cases, the things that could go wrong.
**🔭 expandOrthogonally** — Look sideways. What adjacent concerns, second-order effects, or non-obvious angles haven't been considered?
**⚖️ scoreRankEvaluate** — Weigh options. Rank by quality, risk, or fit. Reach a conclusion.
**💬 respond** — Deliver the output. For `--caveman`, this is where you switch from caveman to human.
