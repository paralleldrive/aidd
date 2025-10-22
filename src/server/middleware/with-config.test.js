import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import { createWithConfig } from "./with-config.js";
import { createServer } from "../test-utils.js";

describe("withConfig", () => {
  test("loads and attaches config to response.locals", async () => {
    const mockConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    };

    const withConfig = createWithConfig(async () => mockConfig);
    const result = await withConfig(createServer());

    assert({
      given: "config loader",
      should: "attach config to response.locals",
      actual: result.response.locals.config,
      expected: mockConfig,
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
      actual: result.response.locals.config.loaded,
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
        result1.response.locals.config.instance !==
        result2.response.locals.config.instance,
      expected: true,
    });
  });
});
