import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import { validateEmail, validateName, validateToken } from "./validation.js";

describe("validateEmail", () => {
  test("valid email", () => {
    assert({
      given: "email with @ symbol",
      should: "return true",
      actual: validateEmail("user@example.com"),
      expected: true,
    });
  });

  test("invalid email", () => {
    assert({
      given: "email without @ symbol",
      should: "return false",
      actual: validateEmail("notanemail"),
      expected: false,
    });

    assert({
      given: "empty string",
      should: "return false",
      actual: !!validateEmail(""),
      expected: false,
    });

    assert({
      given: "null value",
      should: "return false",
      actual: !!validateEmail(null),
      expected: false,
    });
  });
});

describe("validateName", () => {
  test("valid name", () => {
    assert({
      given: "name with 2+ characters",
      should: "return true",
      actual: validateName("Alex Archer"),
      expected: true,
    });

    assert({
      given: "name with exactly 2 characters",
      should: "return true",
      actual: validateName("Al"),
      expected: true,
    });
  });

  test("invalid name", () => {
    assert({
      given: "single character",
      should: "return false",
      actual: validateName("A"),
      expected: false,
    });

    assert({
      given: "empty string",
      should: "return false",
      actual: !!validateName(""),
      expected: false,
    });

    assert({
      given: "whitespace only",
      should: "return false",
      actual: validateName("  "),
      expected: false,
    });

    assert({
      given: "null value",
      should: "return false",
      actual: !!validateName(null),
      expected: false,
    });
  });
});

describe("validateToken", () => {
  test("valid token", () => {
    const validToken = "a".repeat(32);

    assert({
      given: "token with 32+ characters",
      should: "return true",
      actual: validateToken(validToken),
      expected: true,
    });

    assert({
      given: "token with 64 characters",
      should: "return true",
      actual: validateToken("a".repeat(64)),
      expected: true,
    });
  });

  test("invalid token", () => {
    assert({
      given: "token with less than 32 characters",
      should: "return false",
      actual: validateToken("short"),
      expected: false,
    });

    assert({
      given: "empty string",
      should: "return false",
      actual: validateToken(""),
      expected: false,
    });

    assert({
      given: "null value",
      should: "return false",
      actual: validateToken(null),
      expected: false,
    });

    assert({
      given: "non-string value",
      should: "return false",
      actual: validateToken(12345),
      expected: false,
    });
  });
});
