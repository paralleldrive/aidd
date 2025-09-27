import { describe } from "riteway";
import "./unit/cli-core.test.js";
import "./unit/error-conditions.test.js";
import "./unit/cursor-symlink.test.js";

describe("Riteway Installation Test", async (assert) => {
  assert({
    given: "a test suite",
    should: "should run tests",
    actual: true,
    expected: true,
  });
});
