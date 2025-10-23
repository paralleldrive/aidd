import { describe, test, beforeEach, afterEach } from "vitest";
import { assert } from "riteway/vitest";
import {
  createWithConfig,
  loadConfigFromEnv,
  createConfigObject,
} from "./with-config.js";
import { createServer } from "../test-utils.js";

describe("createConfigObject", () => {
  test("returns config object with get() method", () => {
    const config = createConfigObject({ API_KEY: "test-123" });

    assert({
      given: "config data",
      should: "have get method",
      actual: typeof config.get,
      expected: "function",
    });
  });

  test("get() returns value for existing key", () => {
    const config = createConfigObject({ API_KEY: "test-123", PORT: "3000" });

    assert({
      given: "existing key",
      should: "return the value",
      actual: config.get("API_KEY"),
      expected: "test-123",
    });

    assert({
      given: "another existing key",
      should: "return the value",
      actual: config.get("PORT"),
      expected: "3000",
    });
  });

  test("get() throws for missing key", () => {
    const config = createConfigObject({ API_KEY: "test-123", PORT: "3000" });
    let error;

    try {
      config.get("MISSING_KEY");
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing key",
      should: "throw Error with cause",
      actual: error instanceof Error && error.cause !== undefined,
      expected: true,
    });

    assert({
      given: "missing key",
      should: "have ConfigurationError name",
      actual: error.cause.name,
      expected: "ConfigurationError",
    });

    assert({
      given: "missing key",
      should: "include the missing key name in error message",
      actual: error.cause.message.includes("MISSING_KEY"),
      expected: true,
    });

    assert({
      given: "missing key",
      should: "include requested key in cause",
      actual: error.cause.requestedKey,
      expected: "MISSING_KEY",
    });
  });

  test("get() handles undefined values", () => {
    const config = createConfigObject({ OPTIONAL_VAR: undefined });

    assert({
      given: "key with undefined value",
      should: "return undefined (key exists)",
      actual: config.get("OPTIONAL_VAR"),
      expected: undefined,
    });
  });
});

describe("withConfig", () => {
  test("creates config object with get() method", async () => {
    const mockConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    };

    const withConfig = createWithConfig(async () => mockConfig);
    const result = await withConfig(createServer());

    assert({
      given: "config loader",
      should: "attach config with get method to response.locals",
      actual: typeof result.response.locals.config.get,
      expected: "function",
    });

    assert({
      given: "config loader",
      should: "allow getting config values",
      actual: result.response.locals.config.get("apiKey"),
      expected: "test-key",
    });
  });

  test("creates locals object if missing", async () => {
    const mockResponse = {};

    const withConfig = createWithConfig(async () => ({ test: true }));
    const result = await withConfig(
      createServer({
        response: mockResponse,
      }),
    );

    assert({
      given: "response without locals",
      should: "create locals object",
      actual: typeof result.response.locals,
      expected: "object",
    });
  });

  test("returns request and response", async () => {
    const withConfig = createWithConfig(async () => ({}));
    const result = await withConfig(createServer());

    assert({
      given: "middleware execution",
      should: "return request object",
      actual: typeof result.request,
      expected: "object",
    });

    assert({
      given: "middleware execution",
      should: "return response object",
      actual: typeof result.response,
      expected: "object",
    });
  });

  test("handles async config loading", async () => {
    const asyncConfigLoader = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ loaded: true });
        }, 10);
      });
    };

    const withConfig = createWithConfig(asyncConfigLoader);
    const result = await withConfig(createServer());

    assert({
      given: "async config loader",
      should: "load config asynchronously",
      actual: result.response.locals.config.get("loaded"),
      expected: true,
    });
  });

  test("factory creates independent middleware instances", async () => {
    const withConfig1 = createWithConfig(async () => ({ instance: 1 }));
    const withConfig2 = createWithConfig(async () => ({ instance: 2 }));

    const result1 = await withConfig1(createServer());
    const result2 = await withConfig2(createServer());

    assert({
      given: "two factory-created middleware",
      should: "have different configs",
      actual:
        result1.response.locals.config.get("instance") !==
        result2.response.locals.config.get("instance"),
      expected: true,
    });
  });

  test("config.get() throws for missing keys", async () => {
    const withConfig = createWithConfig(async () => ({
      API_KEY: "abc123",
      DATABASE_URL: "postgres://localhost",
    }));
    const result = await withConfig(createServer());
    let error;

    try {
      result.response.locals.config.get("MISSING");
    } catch (e) {
      error = e;
    }

    assert({
      given: "attempt to get missing key",
      should: "throw Error with cause",
      actual: error instanceof Error && error.cause !== undefined,
      expected: true,
    });

    assert({
      given: "attempt to get missing key",
      should: "have ConfigurationError name",
      actual: error.cause.name,
      expected: "ConfigurationError",
    });

    assert({
      given: "attempt to get missing key",
      should: "mention the missing key in message",
      actual: error.cause.message.includes("MISSING"),
      expected: true,
    });

    assert({
      given: "attempt to get missing key",
      should: "include requested key in cause",
      actual: error.cause.requestedKey,
      expected: "MISSING",
    });
  });
});

describe("loadConfigFromEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.API_KEY = "test-api-key-123";
    process.env.PORT = "3000";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("loads specified environment variables", async () => {
    const config = await loadConfigFromEnv(["DATABASE_URL", "API_KEY"]);

    assert({
      given: "list of environment variable names",
      should: "return object with those variables",
      actual: config.DATABASE_URL,
      expected: "postgres://localhost/test",
    });

    assert({
      given: "list of environment variable names",
      should: "include all specified variables",
      actual: config.API_KEY,
      expected: "test-api-key-123",
    });
  });

  test("returns empty object when given empty array", async () => {
    const config = await loadConfigFromEnv([]);

    assert({
      given: "empty array",
      should: "return empty object",
      actual: Object.keys(config).length,
      expected: 0,
    });
  });

  test("handles undefined for missing environment variables", async () => {
    const config = await loadConfigFromEnv(["NONEXISTENT_VAR"]);

    assert({
      given: "nonexistent environment variable",
      should: "return undefined for that key",
      actual: config.NONEXISTENT_VAR,
      expected: undefined,
    });
  });
});
