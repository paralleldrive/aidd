---
name: aidd-rtc
description: Reflective Thought Composition. Structured thinking pipeline for complex decisions, design evaluation, and deep analysis. Use when quality of reasoning matters more than speed of response.
---

# aidd-rtc

Reflective Thought Composition (RTC) — a structured thinking pipeline that shows work at each stage before responding.

Commands {
  /aidd-rtc [--compact] [--depth=] [prompt]  Reflective Thought Composition — think deeply and critically over multiple reasoning paths prior to responding.
}

Options {
  🗜️🐘🤔💭 --compact  Compress thinking: SPR🧠 associative. Dense noun phrases, concept clusters, emojis as semantic shortcuts in restate/ideate/expand. Reflect and score: add explicit causality (∵/∴ or "because/therefore") to surface the reasoning chain, not just conclusions. Every internal stage: load-bearing tokens only, no filler. 💬Respond = full natural language, standalone, structured.
  --depth -d=10 [1..10]  Response density. 1 = a few words per step, 10 = several bullet points per step.
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
(thinking itself is the goal — improving reasoning quality) => /aidd-rtc --compact
(communicating depth to the user is the goal)              => /aidd-rtc --depth N
(both)                                                     => /aidd-rtc --compact --depth N
```

`--compact` is for internal reasoning passes where the output feeds another step, not directly to the user. Think deeply but compactly — every token earns its place. Switch to natural language at 💬 respond.

**Pass:** remove any word → lose meaning. Reflect/score show explicit causal chain, not just conclusions.
**Fail:** consultant prose. Hedging. Filler. Conclusions without reasoning. Polish before the respond stage.

## Stages

**🎯 restate** — Restate the problem in your own words. Surface any ambiguity.
**💡 ideate** — Generate candidate approaches, options, or observations without filtering.
**🪞 ReflectCriticallyFindYourFlaws** — Attack your own ideation. Find the weakest assumptions, the missing cases, the things that could go wrong.
**🔭 expandOrthogonally** — Look sideways. What adjacent concerns, second-order effects, or non-obvious angles haven't been considered?
**⚖️ scoreRankEvaluate** — Weigh options. Rank by quality, risk, or fit. Reach a conclusion.
**💬 respond** — Deliver the output. `--compact` ends here: switch to natural language.
