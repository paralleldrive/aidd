import { describe, test, beforeEach, afterEach, vi } from "vitest";
import { assert } from "riteway/vitest";

// Mock fetch for testing
let mockFetch;

beforeEach(() => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Test helpers for component behavior
const createSignInFormState = ({
  passkeys = [],
  email = "",
  message = "",
  error = "",
} = {}) => ({
  passkeys,
  email,
  message,
  error,
  hasPasskeys: passkeys.length > 0,
});

const validateEmailFormat = (email) => email && email.includes("@");

const handleEmailSubmit = async ({ email, onSuccess, onError }) => {
  if (!validateEmailFormat(email)) {
    onError("Please enter a valid email address");
    return;
  }

  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      onSuccess(data.message || "Magic link sent to your email");
    } else {
      if (data.error?.includes("not found") || data.error?.includes("doesn't exist")) {
        onError("Email not found. Would you like to sign up instead?");
      } else {
        onError(data.error || "Failed to send magic link");
      }
    }
  } catch (err) {
    onError("Network error. Please try again.");
  }
};

describe("SignInForm integration", () => {
  test("email validation", () => {
    const validEmail = "user@example.com";
    const invalidEmail = "notanemail";

    assert({
      given: "valid email format",
      should: "pass validation",
      actual: validateEmailFormat(validEmail),
      expected: true,
    });

    assert({
      given: "invalid email format",
      should: "fail validation",
      actual: validateEmailFormat(invalidEmail),
      expected: false,
    });

    assert({
      given: "empty email",
      should: "fail validation",
      actual: !!validateEmailFormat(""),
      expected: false,
    });
  });

  test("successful email submission", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Magic link sent to your email" }),
    });

    let successMessage = "";
    let errorMessage = "";

    await handleEmailSubmit({
      email: "user@example.com",
      onSuccess: (msg) => {
        successMessage = msg;
      },
      onError: (msg) => {
        errorMessage = msg;
      },
    });

    assert({
      given: "successful email submission",
      should: "call fetch with correct endpoint",
      actual: mockFetch.mock.calls[0][0],
      expected: "/api/auth/signin",
    });

    assert({
      given: "successful email submission",
      should: "use POST method",
      actual: mockFetch.mock.calls[0][1].method,
      expected: "POST",
    });

    assert({
      given: "successful email submission",
      should: "display success message",
      actual: successMessage,
      expected: "Magic link sent to your email",
    });

    assert({
      given: "successful email submission",
      should: "not display error",
      actual: errorMessage,
      expected: "",
    });
  });

  test("email not found suggests signup", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Email not found" }),
    });

    let errorMessage = "";

    await handleEmailSubmit({
      email: "unknown@example.com",
      onSuccess: () => {},
      onError: (msg) => {
        errorMessage = msg;
      },
    });

    assert({
      given: "email not found",
      should: "suggest signup",
      actual: errorMessage,
      expected: "Email not found. Would you like to sign up instead?",
    });
  });

  test("network error handling", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    let errorMessage = "";

    await handleEmailSubmit({
      email: "user@example.com",
      onSuccess: () => {},
      onError: (msg) => {
        errorMessage = msg;
      },
    });

    assert({
      given: "network failure",
      should: "display network error message",
      actual: errorMessage,
      expected: "Network error. Please try again.",
    });
  });

  test("form state with passkeys", () => {
    const passkeys = [
      { id: "pk1", deviceName: "Chrome on MacBook", createdAt: Date.now() },
      { id: "pk2", deviceName: "Safari on iPhone", createdAt: Date.now() },
    ];
    const state = createSignInFormState({ passkeys });

    assert({
      given: "form with passkeys",
      should: "indicate passkeys are available",
      actual: state.hasPasskeys,
      expected: true,
    });

    assert({
      given: "form with passkeys",
      should: "include all passkeys",
      actual: state.passkeys.length,
      expected: 2,
    });
  });

  test("form state without passkeys", () => {
    const state = createSignInFormState({ passkeys: [] });

    assert({
      given: "form without passkeys",
      should: "indicate no passkeys available",
      actual: state.hasPasskeys,
      expected: false,
    });
  });

  test("invalid email submission", async () => {
    let errorMessage = "";

    await handleEmailSubmit({
      email: "invalidemail",
      onSuccess: () => {},
      onError: (msg) => {
        errorMessage = msg;
      },
    });

    assert({
      given: "invalid email format",
      should: "show validation error",
      actual: errorMessage,
      expected: "Please enter a valid email address",
    });

    assert({
      given: "invalid email format",
      should: "not call API",
      actual: mockFetch.mock.calls.length,
      expected: 0,
    });
  });
});
