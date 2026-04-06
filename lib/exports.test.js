// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

describe("aidd/utils export", () => {
  test("imports asyncPipe function successfully", async () => {
    const { asyncPipe } = await import("aidd/utils");

    assert({
      given: "import from aidd/utils",
      should: "successfully import asyncPipe function",
      actual: typeof asyncPipe,
      expected: "function",
    });
  });

  test("imports pipe function successfully", async () => {
    const { pipe } = await import("aidd/utils");

    assert({
      given: "import from aidd/utils",
      should: "successfully import pipe function",
      actual: typeof pipe,
      expected: "function",
    });
  });

  test("imports compose function successfully", async () => {
    const { compose } = await import("aidd/utils");

    assert({
      given: "import from aidd/utils",
      should: "successfully import compose function",
      actual: typeof compose,
      expected: "function",
    });
  });
});

describe("aidd/server export", () => {
  test("imports server module successfully", async () => {
    const serverModule = await import("aidd/server");

    assert({
      given: "import from aidd/server",
      should: "successfully import server module",
      actual: typeof serverModule.createRoute,
      expected: "function",
    });
  });

  test("exports expected server utilities", async () => {
    const {
      createRoute,
      withRequestId,
      createWithCors,
      withServerError,
      createWithConfig,
      loadConfigFromEnv,
      createServer,
    } = await import("aidd/server");

    assert({
      given: "import from aidd/server",
      should: "export all expected functions",
      actual: [
        typeof createRoute,
        typeof withRequestId,
        typeof createWithCors,
        typeof withServerError,
        typeof createWithConfig,
        typeof loadConfigFromEnv,
        typeof createServer,
      ].every((type) => type === "function"),
      expected: true,
    });
  });

  test("includes TypeScript type definitions for server", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const serverExport = pkg.default.exports["./server"];
    const hasTypes = serverExport && "types" in serverExport;

    assert({
      given: "server export configuration",
      should: "include TypeScript type definitions",
      actual: hasTypes,
      expected: true,
    });
  });
});

describe("package.json dependency overrides", () => {
  test("tsmetrics-core typescript peer dep override", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const tsmetricsOverride =
      pkg.default.overrides?.["tsmetrics-core"]?.typescript;

    assert({
      given: "tsmetrics-core declares a TypeScript 4.x peer dep",
      should:
        "override tsmetrics-core typescript peer dep to the root typescript version",
      actual: tsmetricsOverride,
      expected: "$typescript",
    });
  });
});

describe("package.json exports configuration", () => {
  test("does not include root export", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const hasRootExport = "." in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "not include root '.' export",
      actual: hasRootExport,
      expected: false,
    });
  });

  test("includes utils subpath export", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const hasUtilsExport = "./utils" in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "include './utils' subpath export",
      actual: hasUtilsExport,
      expected: true,
    });
  });

  test("includes TypeScript type definitions for utils", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const utilsExport = pkg.default.exports["./utils"];
    const hasTypes = utilsExport && "types" in utilsExport;

    assert({
      given: "utils export configuration",
      should: "include TypeScript type definitions",
      actual: hasTypes,
      expected: true,
    });
  });
});

describe("aidd/agent export", () => {
  test("includes agent subpath export", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const hasAgentExport = "./agent" in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "include './agent' subpath export",
      actual: hasAgentExport,
      expected: true,
    });
  });

  test("imports runAgent function successfully", async () => {
    const { runAgent } = await import("aidd/agent");

    assert({
      given: "import from aidd/agent",
      should: "successfully import runAgent function",
      actual: typeof runAgent,
      expected: "function",
    });
  });

  test("includes TypeScript type definitions for agent", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const agentExport = pkg.default.exports["./agent"];
    const hasTypes = agentExport && "types" in agentExport;

    assert({
      given: "agent export configuration",
      should: "include TypeScript type definitions",
      actual: hasTypes,
      expected: true,
    });
  });
});

describe("aidd/agent-config export", () => {
  test("includes agent-config subpath export", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const hasAgentConfigExport = "./agent-config" in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "include './agent-config' subpath export",
      actual: hasAgentConfigExport,
      expected: true,
    });
  });

  test("imports getAgentConfig and resolveAgentConfig functions successfully", async () => {
    const { getAgentConfig, resolveAgentConfig } = await import(
      "aidd/agent-config"
    );

    assert({
      given: "import from aidd/agent-config",
      should:
        "successfully import getAgentConfig and resolveAgentConfig functions",
      actual: [typeof getAgentConfig, typeof resolveAgentConfig].every(
        (type) => type === "function",
      ),
      expected: true,
    });
  });

  test("includes TypeScript type definitions for agent-config", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const agentConfigExport = pkg.default.exports["./agent-config"];
    const hasTypes = agentConfigExport && "types" in agentConfigExport;

    assert({
      given: "agent-config export configuration",
      should: "include TypeScript type definitions",
      actual: hasTypes,
      expected: true,
    });
  });
});
