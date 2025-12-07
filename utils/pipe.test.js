import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { pipe } from "./pipe.js";

describe("pipe", () => {
  test("pipes functions in sequence", () => {
    const add1 = (x) => x + 1;
    const multiply2 = (x) => x * 2;
    const subtract3 = (x) => x - 3;

    const pipeline = pipe(add1, multiply2, subtract3);
    const result = pipeline(5);

    assert({
      given: "multiple functions",
      should: "apply functions left-to-right in sequence",
      actual: result,
      expected: 9,
    });
  });

  test("handles single function", () => {
    const double = (x) => x * 2;
    const pipeline = pipe(double);
    const result = pipeline(4);

    assert({
      given: "a single function",
      should: "apply the function and return its result",
      actual: result,
      expected: 8,
    });
  });
});
