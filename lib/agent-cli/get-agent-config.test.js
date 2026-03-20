import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { getAgentConfig } from "./config.js";

describe("getAgentConfig", () => {
  test("claude preset", () => {
    assert({
      given: "agent name 'claude'",
      should: "return the claude preset config",
      actual: getAgentConfig("claude"),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("opencode preset", () => {
    assert({
      given: "agent name 'opencode'",
      should: "return the opencode preset config",
      actual: getAgentConfig("opencode"),
      expected: { command: "opencode", args: ["run"] },
    });
  });

  test("cursor preset", () => {
    assert({
      given: "agent name 'cursor'",
      should: "return the cursor preset config",
      actual: getAgentConfig("cursor"),
      expected: { command: "agent", args: ["--print"] },
    });
  });

  test("default preset", () => {
    assert({
      given: "no argument",
      should: "default to the claude preset config",
      actual: getAgentConfig(),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("case-insensitive agent name resolution", () => {
    assert({
      given: "agent name 'Claude' with capital C",
      should: "resolve to the claude preset case-insensitively",
      actual: getAgentConfig("Claude"),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("returns a distinct object on each call", () => {
    const result1 = getAgentConfig("claude");
    const result2 = getAgentConfig("claude");

    assert({
      given: "getAgentConfig called twice with the same name",
      should: "return a distinct object each time (not the same reference)",
      actual: result1 === result2,
      expected: false,
    });
  });

  test("mutating returned args does not affect subsequent calls", () => {
    const result1 = getAgentConfig("claude");
    const originalLength = result1.args?.length ?? 0;
    result1.args?.push("--extra");

    assert({
      given: "args array from first call is mutated",
      should: "not change the args length returned by a subsequent call",
      actual: getAgentConfig("claude").args?.length ?? 0,
      expected: originalLength,
    });
  });

  test("unknown agent name", () => {
    let error;
    try {
      getAgentConfig("unknown-agent");
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "an unknown agent name",
      should: "throw an AgentConfigValidationError",
      actual: error?.cause?.name,
      expected: "AgentConfigValidationError",
    });

    assert({
      given: "an unknown agent name",
      should: "include all supported agent names in the error message",
      actual:
        error?.message?.includes("claude") &&
        error?.message?.includes("opencode") &&
        error?.message?.includes("cursor"),
      expected: true,
    });
  });
});
