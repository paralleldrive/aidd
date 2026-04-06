import { assert } from "riteway/vitest";
import { afterEach, describe, test } from "vitest";

import {
  resetTokenCache,
  resolveGithubAuthToken,
} from "./github-auth-token.js";

describe("resolveGithubAuthToken", () => {
  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    resetTokenCache();
  });

  test("prefers GitHub CLI token over GITHUB_TOKEN and GH_TOKEN", async () => {
    process.env.GITHUB_TOKEN = "env-github";
    process.env.GH_TOKEN = "env-gh";
    const token = await resolveGithubAuthToken({
      getGhToken: async () => "gh-token",
    });

    assert({
      given: "getGhToken returns a value and env tokens are set",
      should: "return the GitHub CLI token",
      actual: token,
      expected: "gh-token",
    });
  });

  test("falls back to GITHUB_TOKEN when gh returns nothing", async () => {
    process.env.GITHUB_TOKEN = "from-github-env";
    const token = await resolveGithubAuthToken({
      getGhToken: async () => undefined,
    });

    assert({
      given: "getGhToken returns undefined and GITHUB_TOKEN is set",
      should: "return GITHUB_TOKEN",
      actual: token,
      expected: "from-github-env",
    });
  });

  test("falls back to GH_TOKEN when gh and GITHUB_TOKEN are absent", async () => {
    process.env.GH_TOKEN = "from-gh-env";
    const token = await resolveGithubAuthToken({
      getGhToken: async () => undefined,
    });

    assert({
      given: "only GH_TOKEN is set",
      should: "return GH_TOKEN",
      actual: token,
      expected: "from-gh-env",
    });
  });

  test("returns undefined when no source provides a token", async () => {
    const token = await resolveGithubAuthToken({
      getGhToken: async () => undefined,
    });

    assert({
      given: "no gh token and no env tokens",
      should: "return undefined",
      actual: token,
      expected: undefined,
    });
  });

  test("GITHUB_TOKEN takes precedence over GH_TOKEN when gh yields nothing", async () => {
    process.env.GITHUB_TOKEN = "win-github";
    process.env.GH_TOKEN = "lose-gh";
    const token = await resolveGithubAuthToken({
      getGhToken: async () => undefined,
    });

    assert({
      given: "both GITHUB_TOKEN and GH_TOKEN are set",
      should: "prefer GITHUB_TOKEN",
      actual: token,
      expected: "win-github",
    });
  });

  test("invokes getGhToken only once across multiple calls (caches result)", async () => {
    let callCount = 0;
    const spy = async () => {
      callCount++;
      return "cached-token";
    };

    const first = await resolveGithubAuthToken({ getGhToken: spy });
    const second = await resolveGithubAuthToken({ getGhToken: spy });

    assert({
      given:
        "resolveGithubAuthToken is called twice with no GITHUB_TOKEN or GH_TOKEN set",
      should: "invoke getGhToken only once",
      actual: callCount,
      expected: 1,
    });

    assert({
      given: "resolveGithubAuthToken is called twice",
      should: "return the same cached token both times",
      actual: { first, second },
      expected: { first: "cached-token", second: "cached-token" },
    });
  });
});
