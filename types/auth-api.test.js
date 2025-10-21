import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

// API Request/Response factory functions
const createSigninRequest = ({ email = "user@example.com" } = {}) => ({
  email,
});

const createSigninResponse = ({
  success = true,
  message = "Magic link sent to your email",
} = {}) => ({
  success,
  message,
});

const createSignupRequest = ({
  email = "user@example.com",
  name = "Alex Archer",
} = {}) => ({
  email,
  name,
});

const createSignupResponse = ({
  success = true,
  message = "Account created successfully",
  userId = "user123",
} = {}) => ({
  success,
  message,
  userId,
});

const createVerifyResponse = ({
  success = true,
  user = {
    id: "user123",
    email: "user@example.com",
    name: "Alex Archer",
    createdAt: Date.now(),
  },
  sessionToken = "sessionToken123",
  error,
} = {}) => {
  const response = { success, user, sessionToken };
  if (error) response.error = error;
  return response;
};

const createPasskeyListResponse = ({
  passkeys = [
    { id: "pk1", deviceName: "Chrome on MacBook", createdAt: Date.now() },
    {
      id: "pk2",
      deviceName: "Safari on iPhone",
      createdAt: Date.now() - 86400000,
    },
  ],
} = {}) => ({
  passkeys,
});

describe("SigninRequest", () => {
  test("valid signin request", () => {
    const request = createSigninRequest();

    assert({
      given: "signin request with email",
      should: "have email field",
      actual: typeof request.email,
      expected: "string",
    });

    assert({
      given: "signin request",
      should: "only contain email field",
      actual: Object.keys(request).length,
      expected: 1,
    });
  });
});

describe("SigninResponse", () => {
  test("successful signin response", () => {
    const response = createSigninResponse();

    assert({
      given: "successful signin",
      should: "have success true",
      actual: response.success,
      expected: true,
    });

    assert({
      given: "successful signin",
      should: "include confirmation message",
      actual: response.message,
      expected: "Magic link sent to your email",
    });
  });
});

describe("SignupRequest", () => {
  test("valid signup request", () => {
    const request = createSignupRequest();

    assert({
      given: "signup request",
      should: "have email field",
      actual: typeof request.email,
      expected: "string",
    });

    assert({
      given: "signup request",
      should: "have name field",
      actual: typeof request.name,
      expected: "string",
    });

    assert({
      given: "signup request with user data",
      should: "include user's name",
      actual: request.name,
      expected: "Alex Archer",
    });
  });
});

describe("SignupResponse", () => {
  test("successful signup response", () => {
    const response = createSignupResponse();

    assert({
      given: "successful signup",
      should: "return userId for new user",
      actual: typeof response.userId,
      expected: "string",
    });

    assert({
      given: "successful signup",
      should: "have success true",
      actual: response.success,
      expected: true,
    });
  });
});

describe("VerifyResponse", () => {
  test("successful magic link verification", () => {
    const response = createVerifyResponse();

    assert({
      given: "successful verification",
      should: "return user object",
      actual: typeof response.user.id,
      expected: "string",
    });

    assert({
      given: "successful verification",
      should: "return session token",
      actual: typeof response.sessionToken,
      expected: "string",
    });

    assert({
      given: "successful verification",
      should: "not have error field",
      actual: response.error,
      expected: undefined,
    });
  });

  test("failed verification with expired link", () => {
    const response = createVerifyResponse({
      success: false,
      user: null,
      sessionToken: null,
      error: "Link has expired",
    });

    assert({
      given: "expired magic link",
      should: "have success false",
      actual: response.success,
      expected: false,
    });

    assert({
      given: "expired magic link",
      should: "include error message",
      actual: response.error,
      expected: "Link has expired",
    });
  });

  test("failed verification with invalid link", () => {
    const response = createVerifyResponse({
      success: false,
      user: null,
      sessionToken: null,
      error: "Invalid or expired link",
    });

    assert({
      given: "invalid magic link",
      should: "include error message",
      actual: response.error,
      expected: "Invalid or expired link",
    });
  });
});

describe("PasskeyListResponse", () => {
  test("user with multiple passkeys", () => {
    const response = createPasskeyListResponse();

    assert({
      given: "user with registered passkeys",
      should: "return array of passkeys",
      actual: Array.isArray(response.passkeys),
      expected: true,
    });

    assert({
      given: "passkey list with device info",
      should: "include human-readable device names",
      actual: response.passkeys[0].deviceName,
      expected: "Chrome on MacBook",
    });

    assert({
      given: "passkey list",
      should: "include creation timestamps",
      actual: typeof response.passkeys[0].createdAt,
      expected: "number",
    });
  });

  test("user with no passkeys", () => {
    const response = createPasskeyListResponse({ passkeys: [] });

    assert({
      given: "user without passkeys",
      should: "return empty array",
      actual: response.passkeys.length,
      expected: 0,
    });
  });
});
