import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { compose } from "./compose.js";

describe("compose", () => {
  test("composes functions in reverse sequence", () => {
    const add1 = (x) => x + 1;
    const multiply2 = (x) => x * 2;
    const subtract3 = (x) => x - 3;

    const composed = compose(subtract3, multiply2, add1);
    const result = composed(5);

    assert({
      given: "multiple functions",
      should: "apply functions right-to-left in sequence",
      actual: result,
      expected: 9,
    });
  });

  test("handles single function", () => {
    const double = (x) => x * 2;
    const composed = compose(double);
    const result = composed(4);

    assert({
      given: "a single function",
      should: "apply the function and return its result",
      actual: result,
      expected: 8,
    });
  });

  test("demonstrates right-to-left execution order", () => {
    const add1 = (x) => x + 1;
    const multiply2 = (x) => x * 2;

    const composed = compose(multiply2, add1);
    const result = composed(5);

    assert({
      given: "functions in mathematical composition order",
      should: "execute rightmost function first",
      actual: result,
      expected: 12,
    });
  });
});
