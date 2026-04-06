import { createError } from "error-causes";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  AgentConfigParseError,
  AgentConfigReadError,
  AgentConfigValidationError,
  handleAgentErrors,
} from "./errors.js";

describe("AgentConfigReadError", () => {
  test("error cause shape", () => {
    assert({
      given: "the exported error cause",
      should: "have the correct name",
      actual: AgentConfigReadError.name,
      expected: "AgentConfigReadError",
    });

    assert({
      given: "the exported error cause",
      should: "have the correct code",
      actual: AgentConfigReadError.code,
      expected: "AGENT_CONFIG_READ_ERROR",
    });
  });

  test("thrown error carries cause", () => {
    const error = createError(AgentConfigReadError);

    assert({
      given: "an error created from AgentConfigReadError",
      should: "carry the cause name",
      actual: error.cause.name,
      expected: "AgentConfigReadError",
    });

    assert({
      given: "an error created from AgentConfigReadError",
      should: "carry the cause code",
      actual: error.cause.code,
      expected: "AGENT_CONFIG_READ_ERROR",
    });
  });
});

describe("AgentConfigParseError", () => {
  test("error cause shape", () => {
    assert({
      given: "the exported error cause",
      should: "have the correct name",
      actual: AgentConfigParseError.name,
      expected: "AgentConfigParseError",
    });

    assert({
      given: "the exported error cause",
      should: "have the correct code",
      actual: AgentConfigParseError.code,
      expected: "AGENT_CONFIG_PARSE_ERROR",
    });
  });

  test("thrown error carries cause", () => {
    const error = createError(AgentConfigParseError);

    assert({
      given: "an error created from AgentConfigParseError",
      should: "carry the cause name",
      actual: error.cause.name,
      expected: "AgentConfigParseError",
    });

    assert({
      given: "an error created from AgentConfigParseError",
      should: "carry the cause code",
      actual: error.cause.code,
      expected: "AGENT_CONFIG_PARSE_ERROR",
    });
  });
});

describe("AgentConfigValidationError", () => {
  test("error cause shape", () => {
    assert({
      given: "the exported error cause",
      should: "have the correct name",
      actual: AgentConfigValidationError.name,
      expected: "AgentConfigValidationError",
    });

    assert({
      given: "the exported error cause",
      should: "have the correct code",
      actual: AgentConfigValidationError.code,
      expected: "AGENT_CONFIG_VALIDATION_ERROR",
    });
  });

  test("thrown error carries cause", () => {
    const error = createError(AgentConfigValidationError);

    assert({
      given: "an error created from AgentConfigValidationError",
      should: "carry the cause name",
      actual: error.cause.name,
      expected: "AgentConfigValidationError",
    });

    assert({
      given: "an error created from AgentConfigValidationError",
      should: "carry the cause code",
      actual: error.cause.code,
      expected: "AGENT_CONFIG_VALIDATION_ERROR",
    });
  });
});

describe("handleAgentErrors", () => {
  test("is a function", () => {
    assert({
      given: "the exported handleAgentErrors",
      should: "be a function",
      actual: typeof handleAgentErrors,
      expected: "function",
    });
  });

  test("enforces exhaustive handling — throws when a handler is missing", () => {
    let error;
    try {
      // @ts-expect-error intentionally incomplete handlers to test exhaustive check
      handleAgentErrors({
        AgentConfigReadError: () => {},
        AgentConfigParseError: () => {},
      });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "handlers object missing AgentConfigValidationError",
      should: "throw a MissingHandler error",
      actual: error instanceof Error,
      expected: true,
    });

    assert({
      given: "handlers object missing AgentConfigValidationError",
      should: "identify the missing handler in the cause name",
      actual: error.cause.name,
      expected: "MissingHandler",
    });
  });

  test("routes to the matching handler", () => {
    const dispatch = handleAgentErrors({
      AgentConfigReadError: (e) => `read:${e.cause.code}`,
      AgentConfigParseError: (e) => `parse:${e.cause.code}`,
      AgentConfigValidationError: (e) => `validation:${e.cause.code}`,
    });

    const result = dispatch(createError(AgentConfigReadError));

    assert({
      given: "an AgentConfigReadError dispatched through handleAgentErrors",
      should: "invoke the AgentConfigReadError handler",
      actual: result,
      expected: "read:AGENT_CONFIG_READ_ERROR",
    });
  });
});
