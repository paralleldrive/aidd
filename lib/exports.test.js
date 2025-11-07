import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

describe("aidd/asyncPipe export", () => {
  test("imports asyncPipe function successfully", async () => {
    const { asyncPipe } = await import("aidd/asyncPipe");

    assert({
      given: "import from aidd/asyncPipe",
      should: "successfully import asyncPipe function",
      actual: typeof asyncPipe,
      expected: "function",
    });
  });

  test("composes functions correctly", async () => {
    const { asyncPipe } = await import("aidd/asyncPipe");
    const add1 = (x) => x + 1;
    const multiply2 = (x) => x * 2;
    const pipeline = asyncPipe(add1, multiply2);
    const result = await pipeline(5);

    assert({
      given: "asyncPipe imported from aidd/asyncPipe",
      should: "compose functions correctly",
      actual: result,
      expected: 12,
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

  test("exports createRoute and withRequestId", async () => {
    const { createRoute, withRequestId } = await import("aidd/server");

    assert({
      given: "import from aidd/server",
      should: "export createRoute function",
      actual: typeof createRoute,
      expected: "function",
    });

    assert({
      given: "import from aidd/server",
      should: "export withRequestId middleware",
      actual: typeof withRequestId,
      expected: "function",
    });
  });
});

describe("package.json exports configuration", () => {
  test("does not include root export", async () => {
    const pkg = await import("../package.json", { assert: { type: "json" } });
    const hasRootExport = "." in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "not include root '.' export",
      actual: hasRootExport,
      expected: false,
    });
  });

  test("includes asyncPipe subpath export", async () => {
    const pkg = await import("../package.json", { assert: { type: "json" } });
    const hasAsyncPipeExport = "./asyncPipe" in pkg.default.exports;

    assert({
      given: "package.json exports field",
      should: "include './asyncPipe' subpath export",
      actual: hasAsyncPipeExport,
      expected: true,
    });
  });

  test("includes TypeScript type definitions", async () => {
    const pkg = await import("../package.json", { assert: { type: "json" } });
    const asyncPipeExport = pkg.default.exports["./asyncPipe"];
    const hasTypes = asyncPipeExport && "types" in asyncPipeExport;

    assert({
      given: "asyncPipe export configuration",
      should: "include TypeScript type definitions",
      actual: hasTypes,
      expected: true,
    });
  });
});
