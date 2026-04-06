// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { resolveClaudeEvalAvailability } from "./claude-token-usable.js";

describe("resolveClaudeEvalAvailability", () => {
  test("missing token skips eval", () => {
    assert({
      given: "no OAuth token",
      should: "mark Claude AI eval as unavailable",
      actual: resolveClaudeEvalAvailability({
        token: "",
        probeOk: true,
      }).available,
      expected: false,
    });
  });

  test("whitespace-only token skips eval", () => {
    assert({
      given: "a whitespace-only OAuth token",
      should: "mark Claude AI eval as unavailable",
      actual: resolveClaudeEvalAvailability({
        token: "   \t\n",
        probeOk: true,
      }).available,
      expected: false,
    });
  });

  test("set token with failed probe skips eval", () => {
    assert({
      given:
        "a non-empty OAuth token and a failed Claude probe (auth or quota)",
      should: "mark Claude AI eval as unavailable",
      actual: resolveClaudeEvalAvailability({
        token: "present-but-bad",
        probeOk: false,
      }).available,
      expected: false,
    });
  });

  test("set token with successful probe runs eval", () => {
    assert({
      given: "a non-empty OAuth token and a successful Claude probe",
      should: "mark Claude AI eval as available",
      actual: resolveClaudeEvalAvailability({
        token: "valid-token",
        probeOk: true,
      }).available,
      expected: true,
    });
  });
});
