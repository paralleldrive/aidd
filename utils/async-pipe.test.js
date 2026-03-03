// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { asyncPipe } from "./async-pipe.js";

describe("asyncPipe", () => {
  test("pipes async functions in sequence", async () => {
    const add1 = async (/** @type {number} */ x) => x + 1;
    const multiply2 = async (/** @type {number} */ x) => x * 2;
    const subtract3 = async (/** @type {number} */ x) => x - 3;

    const pipeline = asyncPipe(add1, multiply2, subtract3);
    const result = await pipeline(5);

    assert({
      given: "multiple async functions",
      should: "apply functions left-to-right, awaiting each result",
      actual: result,
      expected: 9,
    });
  });

  test("handles single function", async () => {
    const double = async (/** @type {number} */ x) => x * 2;
    const pipeline = asyncPipe(double);
    const result = await pipeline(4);

    assert({
      given: "a single async function",
      should: "apply the function and return its result",
      actual: result,
      expected: 8,
    });
  });
});
