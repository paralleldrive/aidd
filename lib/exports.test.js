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

describe("package.json scripts configuration", () => {
  test("npm test excludes e2e tests", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const testScript = pkg.default.scripts.test;
    const runsE2e =
      !testScript.includes("--exclude") &&
      !testScript.includes("test:unit") &&
      !testScript.includes("exclude");

    assert({
      given: "npm test is invoked",
      should: "not run e2e test files",
      actual: runsE2e,
      expected: false,
    });
  });

  test("npm run test:unit excludes e2e tests", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const testUnitScript = pkg.default.scripts["test:unit"];

    assert({
      given: "npm run test:unit is invoked",
      should: "exclude e2e test files",
      actual: testUnitScript.includes("--exclude"),
      expected: true,
    });
  });

  test("npm run test:e2e only targets e2e tests", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    const testE2eScript = pkg.default.scripts["test:e2e"];

    assert({
      given: "npm run test:e2e is invoked",
      should: "only target e2e test files",
      actual: testE2eScript.includes("e2e"),
      expected: true,
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
