# AI Eval: aidd-tdd mocking constraint

Evaluates whether an agent correctly applies the **mocking decision framework** from `ai/skills/aidd-tdd/SKILL.md` (the `Mocking is a code smell` constraint: build mocked vs integration candidates, compare with `/aidd-churn`, require composite score **and** meaningful functional exercise; cheaper substitutes when both hold; exceptions for infeasible/prohibitively expensive cases).

---

## System / context (skill to apply)

The agent must reason using this excerpt from the skill:

> Mocks in unit tests ⇒ build both a mocked and an integration candidate; run `/aidd-churn` to compare total code impact; the winning approach must (1) lower or match the composite score **and** (2) meaningfully exercise the functional requirement of the unit under test — not just verify mock calls. Cheaper substitutes (e.g. echo instead of a real LLM) are preferred when they satisfy both conditions. Mocks are only justified when real integration is (a) technically infeasible or (b) prohibitively expensive.

---

## Fixture (code to review)

The following Vitest file uses `vi.mock("child_process")` around tests for `runAgent`, which spawns a child process and waits for exit. It mixes happy-path mocking, an E2BIG error path, an `echo`-as-LLM-substitute integration-style exercise, and a test that only inspects mock call shapes.

```javascript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { spawn } from "child_process";
import { runAgent } from "../runAgent.js";

vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));

function mockChildExit(code) {
  return {
    on: (ev, fn) => {
      if (ev === "exit") queueMicrotask(() => fn(code));
    },
  };
}

describe("runAgent", () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
  });

  test("happy path: completes when child exits 0", async () => {
    vi.mocked(spawn).mockReturnValue(mockChildExit(0));
    const result = await runAgent({
      command: "node",
      args: ["-e", "process.exit(0)"],
    });
    expect(result.exitCode).toBe(0);
  });

  test("E2BIG: surfaces spawn failure when argument list is too large", async () => {
    const e2big = Object.assign(new Error("spawn E2BIG"), { code: "E2BIG" });
    vi.mocked(spawn).mockImplementation(() => {
      throw e2big;
    });
    await expect(
      runAgent({ command: "node", args: new Array(500_000).fill("x") }),
    ).rejects.toMatchObject({ code: "E2BIG" });
  });

  test("uses echo instead of paid LLM binary while still spawning and waiting for exit", async () => {
    vi.mocked(spawn).mockReturnValue(mockChildExit(0));
    await runAgent({
      command: "echo",
      args: ["stub-llm-response"],
      env: { ...process.env, AIDD_AGENT_BACKEND: "echo" },
    });
    expect(spawn).toHaveBeenCalled();
  });

  test("builds spawn argv shape for agent wrapper", async () => {
    vi.mocked(spawn).mockReturnValue(mockChildExit(0));
    await runAgent({ command: "node", args: ["agent.mjs", "--task", "ping"] });
    const firstCall = vi.mocked(spawn).mock.calls[0];
    expect(firstCall[0]).toBe("node");
    expect(firstCall[1]).toEqual(
      expect.arrayContaining(["agent.mjs", "--task", "ping"]),
    );
    expect(firstCall[2]).toMatchObject({ stdio: expect.anything() });
  });
});
```

---

## Grading criteria (`**Given…, should…**`)

**Given** a unit test containing `vi.mock` for an I/O module, **should** identify that the mocking constraint applies and state that two candidates must be compared using `/aidd-churn` before a recommendation can be made.

**Given** pre-run `/aidd-churn` output showing the integration candidate scores 20% lower **and** fidelity context showing it exercises real spawn-and-exit behavior rather than verifying mock call arguments, **should** recommend removing the mock.

**Given** a test that mocks `spawn` for an E2BIG error path (argument list too large), **should** recognize this as a justified exception — the condition is technically infeasible to reproduce without unusual OS setup — and recommend keeping the mock.

**Given** `echo` used as a substitute for a real LLM in a `runAgent` test, **should** recognize `echo` as a valid cheaper substitute that satisfies both conditions: it lowers or matches the composite churn score **and** it meaningfully exercises the functional requirement of spawn-and-exit without calling a paid external API.

**Given** a test that only verifies mock call argument shapes (e.g. asserts `mockFn.mock.calls[0][0]` structure) rather than observable system behavior, **should** flag it as failing the functional requirement fidelity condition.

**Given** pre-run `/aidd-churn` output showing the mock candidate scores 15% lower **and** the mock genuinely exercises the functional requirement (not just wiring), **should** recommend keeping the mock.
