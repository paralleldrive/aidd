import { describe, test, vi } from "vitest";
import { assert } from "riteway/vitest";
import { Type } from "@sinclair/typebox";
import { handleForm } from "./handle-form.js";

describe("handleForm", () => {
  // Req 1: Valid body passes to processSubmission
  test("passes validated fields to processSubmission when body matches schema", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const schema = Type.Object(
      {
        name: Type.String(),
        email: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "contact",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "John", email: "john@example.com" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request body matching the schema",
      should: "call processSubmission with validated fields",
      actual: processSubmission.mock.calls[0]?.[0],
      expected: { name: "John", email: "john@example.com" },
    });
  });

  // Req 2: Invalid body returns 400 with validation errors
  test("returns 400 with validation errors when body fails schema", async () => {
    const processSubmission = vi.fn();
    const schema = Type.Object(
      {
        name: Type.String(),
        age: Type.Number(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "profile",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "John", age: "not a number" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request body failing schema validation",
      should: "return 400 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 400,
    });

    assert({
      given: "a request body failing schema validation",
      should: "return array of validation errors",
      actual: Array.isArray(mockResponse.json.mock.calls[0]?.[0]?.errors),
      expected: true,
    });

    assert({
      given: "a request body failing schema validation",
      should: "not call processSubmission",
      actual: processSubmission.mock.calls.length,
      expected: 0,
    });
  });

  // Req 3: Honeypot field filled rejects with generic error
  test("rejects with 400 and generic error when honeypot field is filled", async () => {
    const processSubmission = vi.fn();
    const schema = Type.Object(
      {
        name: Type.String(),
        website: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "signup",
      schema,
      processSubmission,
      pii: [],
      honeypotField: "website",
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "Bot", website: "http://spam.com" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request with filled honeypot field",
      should: "return 400 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 400,
    });

    assert({
      given: "a request with filled honeypot field",
      should: "return generic validation error (no honeypot indication)",
      actual: mockResponse.json.mock.calls[0]?.[0]?.errors?.some((e) =>
        e.toLowerCase().includes("honeypot"),
      ),
      expected: false,
    });

    assert({
      given: "a request with filled honeypot field",
      should: "not call processSubmission",
      actual: processSubmission.mock.calls.length,
      expected: 0,
    });
  });

  // Req 3b: Empty string honeypot allows submission
  test("allows submission when honeypot field is empty string", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const schema = Type.Object(
      {
        name: Type.String(),
        website: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "contact",
      schema,
      processSubmission,
      pii: [],
      honeypotField: "website",
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "Human", website: "" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request with empty string honeypot field",
      should: "allow submission (call processSubmission)",
      actual: processSubmission.mock.calls.length,
      expected: 1,
    });

    assert({
      given: "a request with empty string honeypot field",
      should: "not return error status",
      actual: mockResponse.status.mock.calls.length,
      expected: 0,
    });
  });

  // Req 4: Missing required fields returns 400 with specific errors
  test("returns 400 with missing field errors when required fields absent", async () => {
    const processSubmission = vi.fn();
    const schema = Type.Object(
      {
        name: Type.String(),
        email: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "contact",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "John" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request missing required fields",
      should: "return 400 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 400,
    });

    const errors = mockResponse.json.mock.calls[0]?.[0]?.errors || [];
    assert({
      given: "a request missing required fields",
      should: "indicate missing field in error",
      actual: errors.some((e) => e.includes("email")),
      expected: true,
    });
  });

  // Req 5: processSubmission error surfaces through createRoute
  test("throws error when processSubmission throws", async () => {
    const processSubmission = vi.fn().mockRejectedValue(new Error("DB error"));
    const schema = Type.Object(
      { name: Type.String() },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "test",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    let error;
    try {
      await middleware({
        request: { body: { name: "John" } },
        response: mockResponse,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "processSubmission throws an error",
      should: "surface error for createRoute error handling",
      actual: error?.message,
      expected: "DB error",
    });
  });

  // Req 6: Successful submission returns { request, response } without setting status/body
  test("returns request/response without setting status on success", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const schema = Type.Object(
      { name: Type.String() },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "test",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const result = await middleware({
      request: { body: { name: "John" } },
      response: mockResponse,
    });

    assert({
      given: "a successful form submission",
      should: "return request object",
      actual: typeof result.request,
      expected: "object",
    });

    assert({
      given: "a successful form submission",
      should: "return response object",
      actual: typeof result.response,
      expected: "object",
    });

    assert({
      given: "a successful form submission",
      should: "not set status (caller handles response)",
      actual: mockResponse.status.mock.calls.length,
      expected: 0,
    });
  });

  // Req 7: PII fields passed to logger.scrub
  test("passes PII fields to logger.scrub", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const scrubFn = vi.fn();
    const schema = Type.Object(
      {
        name: Type.String(),
        ssn: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "sensitive",
      schema,
      processSubmission,
      pii: ["ssn"],
    });

    const mockResponse = {
      locals: { logger: { scrub: scrubFn } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: { body: { name: "John", ssn: "123-45-6789" }, locals: {} },
      response: mockResponse,
    });

    assert({
      given: "PII fields configured",
      should: "call logger.scrub with PII field names",
      actual: scrubFn.mock.calls[0]?.[0],
      expected: ["ssn"],
    });
  });

  // Req 8: Undeclared fields return 400
  test("returns 400 when request contains undeclared fields", async () => {
    const processSubmission = vi.fn();
    const schema = Type.Object(
      {
        name: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "strict",
      schema,
      processSubmission,
      pii: [],
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "John", extraField: "not allowed" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request with undeclared fields",
      should: "return 400 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 400,
    });

    const errors = mockResponse.json.mock.calls[0]?.[0]?.errors || [];
    assert({
      given: "a request with undeclared fields",
      should: "indicate undeclared field in error",
      actual: errors.some(
        (e) => e.includes("extraField") || e.includes("additional"),
      ),
      expected: true,
    });
  });

  // Req 9: Honeypot omitted skips validation
  test("skips honeypot validation when honeypotField not provided", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const schema = Type.Object(
      {
        name: Type.String(),
        website: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "no-honeypot",
      schema,
      processSubmission,
      pii: [],
      // honeypotField intentionally omitted
    });

    const mockResponse = {
      locals: { logger: { scrub: vi.fn() } },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "Human", website: "http://real-site.com" },
      },
      response: mockResponse,
    });

    assert({
      given: "no honeypotField configured and website field filled",
      should: "allow submission (call processSubmission)",
      actual: processSubmission.mock.calls.length,
      expected: 1,
    });
  });

  // Req 10: Parameter validation at factory time
  test("throws error when name is missing", () => {
    const schema = Type.Object({ name: Type.String() });

    let error;
    try {
      handleForm({
        schema,
        processSubmission: async () => {},
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "handleForm called without name",
      should: "throw error with clear message",
      actual: error?.message,
      expected: "handleForm: name is required",
    });
  });

  test("throws error when schema is missing", () => {
    let error;
    try {
      handleForm({
        name: "test",
        processSubmission: async () => {},
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "handleForm called without schema",
      should: "throw error with clear message",
      actual: error?.message,
      expected: "handleForm: schema is required",
    });
  });

  test("throws error when processSubmission is missing", () => {
    const schema = Type.Object({ name: Type.String() });

    let error;
    try {
      handleForm({
        name: "test",
        schema,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "handleForm called without processSubmission",
      should: "throw error with clear message",
      actual: error?.message,
      expected: "handleForm: processSubmission is required",
    });
  });

  // Req 11: Skip processing if prior middleware rejected request
  test("skips processing if response already has error status", async () => {
    const processSubmission = vi.fn();
    const schema = Type.Object(
      { name: Type.String() },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "after-csrf",
      schema,
      processSubmission,
    });

    const mockResponse = {
      locals: {},
      statusCode: 403, // Prior middleware (e.g., withCSRF) rejected
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "Attacker" },
      },
      response: mockResponse,
    });

    assert({
      given: "a response with 403 status from prior middleware",
      should: "not call processSubmission",
      actual: processSubmission.mock.calls.length,
      expected: 0,
    });
  });

  // Req 12: Strip _csrf from body before validation (for withCSRF compatibility)
  test("strips _csrf field from body before validation", async () => {
    const processSubmission = vi.fn().mockResolvedValue({});
    const schema = Type.Object(
      {
        name: Type.String(),
      },
      { additionalProperties: false },
    );

    const middleware = handleForm({
      name: "csrf-compat",
      schema,
      processSubmission,
    });

    const mockResponse = {
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await middleware({
      request: {
        body: { name: "John", _csrf: "csrf-token-value" },
      },
      response: mockResponse,
    });

    assert({
      given: "a request with _csrf field and strict schema",
      should: "allow submission (strip _csrf before validation)",
      actual: processSubmission.mock.calls.length,
      expected: 1,
    });

    assert({
      given: "a request with _csrf field",
      should: "pass body without _csrf to processSubmission",
      actual: processSubmission.mock.calls[0]?.[0],
      expected: { name: "John" },
    });
  });
});
