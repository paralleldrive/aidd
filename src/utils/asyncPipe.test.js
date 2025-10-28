import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { asyncPipe } from "./asyncPipe.js";

describe("asyncPipe", () => {
  test("pipes async functions in sequence", async () => {
    const add1 = async (x) => x + 1;
    const multiply2 = async (x) => x * 2;
    const subtract3 = async (x) => x - 3;

    const pipeline = asyncPipe(add1, multiply2, subtract3);
    const result = await pipeline(5);

    assert({
      given: "a pipeline of async functions and initial value 5",
      should: "apply functions in sequence: (5 + 1) * 2 - 3 = 9",
      actual: result,
      expected: 9,
    });
  });

  test("handles single function", async () => {
    const double = async (x) => x * 2;
    const pipeline = asyncPipe(double);
    const result = await pipeline(4);

    assert({
      given: "a pipeline with single async function",
      should: "apply the function correctly",
      actual: result,
      expected: 8,
    });
  });
});
