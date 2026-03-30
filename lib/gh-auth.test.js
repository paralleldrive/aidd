import { assert } from "riteway/vitest";
import { afterEach, describe, test } from "vitest";

import { getGitHubToken, resetGhTokenCache } from "./gh-auth.js";

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
  resetGhTokenCache();
});

describe("getGitHubToken", () => {
  test("returns GITHUB_TOKEN env var when set", async () => {
    process.env.GITHUB_TOKEN = "env-token-abc";

    const token = await getGitHubToken();

    assert({
      given: "GITHUB_TOKEN is set in the environment",
      should: "return the env var value",
      actual: token,
      expected: "env-token-abc",
    });
  });

  test("prefers GITHUB_TOKEN over gh CLI", async () => {
    process.env.GITHUB_TOKEN = "env-token";
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      cb(null, "gh-cli-token\n");
    };

    const token = await getGitHubToken({ execFileFn });

    assert({
      given: "both GITHUB_TOKEN env var and gh CLI would return a token",
      should: "prefer GITHUB_TOKEN (never spawns gh)",
      actual: token,
      expected: "env-token",
    });
  });

  test("falls back to gh auth token when GITHUB_TOKEN is unset", async () => {
    delete process.env.GITHUB_TOKEN;
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      cb(null, "gh-cli-token-123\n");
    };

    const token = await getGitHubToken({ execFileFn });

    assert({
      given: "GITHUB_TOKEN is not set and gh auth token succeeds",
      should: "return the trimmed token from gh CLI",
      actual: token,
      expected: "gh-cli-token-123",
    });
  });

  test("returns undefined when GITHUB_TOKEN is unset and gh is not available", async () => {
    delete process.env.GITHUB_TOKEN;
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      cb(new Error("command not found: gh"));
    };

    const token = await getGitHubToken({ execFileFn });

    assert({
      given: "GITHUB_TOKEN is not set and gh CLI is not installed",
      should: "return undefined",
      actual: token,
      expected: undefined,
    });
  });

  test("returns undefined when gh auth token returns empty output", async () => {
    delete process.env.GITHUB_TOKEN;
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      cb(null, "\n");
    };

    const token = await getGitHubToken({ execFileFn });

    assert({
      given: "GITHUB_TOKEN is not set and gh auth token returns empty string",
      should: "return undefined",
      actual: token,
      expected: undefined,
    });
  });

  test("caches the gh CLI result across calls", async () => {
    delete process.env.GITHUB_TOKEN;
    let callCount = 0;
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      callCount++;
      cb(null, "cached-token\n");
    };

    await getGitHubToken({ execFileFn });
    await getGitHubToken({ execFileFn });

    assert({
      given: "getGitHubToken is called twice without GITHUB_TOKEN",
      should: "only spawn gh once (result is cached)",
      actual: callCount,
      expected: 1,
    });
  });

  test("caches the failure so gh is not retried on every call", async () => {
    delete process.env.GITHUB_TOKEN;
    let callCount = 0;
    const failingExec = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      callCount++;
      cb(new Error("not found"));
    };

    await getGitHubToken({ execFileFn: failingExec });
    await getGitHubToken({ execFileFn: failingExec });

    assert({
      given: "gh CLI fails on first call",
      should: "cache the failure and not retry on second call",
      actual: callCount,
      expected: 1,
    });
  });

  test("resetGhTokenCache clears the cached value", async () => {
    delete process.env.GITHUB_TOKEN;
    let callCount = 0;
    const execFileFn = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      callCount++;
      cb(null, "token\n");
    };

    await getGitHubToken({ execFileFn });
    resetGhTokenCache();
    await getGitHubToken({ execFileFn });

    assert({
      given: "cache is reset between calls",
      should: "spawn gh again on the second call",
      actual: callCount,
      expected: 2,
    });
  });

  test("GITHUB_TOKEN env var bypasses cache entirely", async () => {
    delete process.env.GITHUB_TOKEN;
    const failingExec = (
      /** @type {any} */ _cmd,
      /** @type {any} */ _args,
      /** @type {Function} */ cb,
    ) => {
      cb(new Error("not found"));
    };
    await getGitHubToken({ execFileFn: failingExec });

    process.env.GITHUB_TOKEN = "override-token";
    const token = await getGitHubToken({ execFileFn: failingExec });

    assert({
      given: "gh CLI failed previously but GITHUB_TOKEN is now set",
      should: "return the env var (env always takes priority over cache)",
      actual: token,
      expected: "override-token",
    });
  });
});
