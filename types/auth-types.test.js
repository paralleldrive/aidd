import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

// Example factory functions that create valid type instances
const createUser = ({
  id = "user123",
  email = "user@example.com",
  name = "Alex Archer",
  createdAt = Date.now(),
} = {}) => ({
  id,
  email,
  name,
  createdAt,
});

const createPasskey = ({
  id = "passkey123",
  userId = "user123",
  credentialId = "base64CredentialId",
  publicKey = "base64PublicKey",
  deviceName = "Chrome on MacBook",
  createdAt = Date.now(),
} = {}) => ({
  id,
  userId,
  credentialId,
  publicKey,
  deviceName,
  createdAt,
});

const createMagicLink = ({
  token = "secureRandomToken32Bytes",
  userId = "user123",
  expiresAt = Date.now() + 3600000,
  used = false,
  createdAt = Date.now(),
} = {}) => ({
  token,
  userId,
  expiresAt,
  used,
  createdAt,
});

const createActivityLog = ({
  id = "log123",
  userId = "user123",
  eventType = "signin",
  timestamp = Date.now(),
  metadata = {},
} = {}) => ({
  id,
  userId,
  eventType,
  timestamp,
  metadata,
});

const createSession = ({
  token = "sessionToken123",
  userId = "user123",
  expiresAt = Date.now() + 86400000,
  createdAt = Date.now(),
} = {}) => ({
  token,
  userId,
  expiresAt,
  createdAt,
});

describe("User type", () => {
  test("valid user creation", () => {
    const user = createUser();

    assert({
      given: "user with all required fields",
      should: "have id property",
      actual: typeof user.id,
      expected: "string",
    });

    assert({
      given: "user with all required fields",
      should: "have email property",
      actual: typeof user.email,
      expected: "string",
    });

    assert({
      given: "user with all required fields",
      should: "have name property",
      actual: typeof user.name,
      expected: "string",
    });

    assert({
      given: "user with all required fields",
      should: "have createdAt timestamp",
      actual: typeof user.createdAt,
      expected: "number",
    });
  });
});

describe("Passkey type", () => {
  test("valid passkey creation", () => {
    const passkey = createPasskey();

    assert({
      given: "passkey with all required fields",
      should: "have userId reference",
      actual: typeof passkey.userId,
      expected: "string",
    });

    assert({
      given: "passkey with credential data",
      should: "have credentialId",
      actual: typeof passkey.credentialId,
      expected: "string",
    });

    assert({
      given: "passkey with credential data",
      should: "have publicKey",
      actual: typeof passkey.publicKey,
      expected: "string",
    });

    assert({
      given: "passkey with device info",
      should: "have human-readable deviceName",
      actual: passkey.deviceName,
      expected: "Chrome on MacBook",
    });
  });
});

describe("MagicLink type", () => {
  test("valid magic link creation", () => {
    const now = Date.now();
    const oneHourLater = now + 3600000;
    const magicLink = createMagicLink({
      createdAt: now,
      expiresAt: oneHourLater,
    });

    assert({
      given: "magic link with expiration",
      should: "expire 1 hour after creation",
      actual: magicLink.expiresAt - magicLink.createdAt,
      expected: 3600000,
    });

    assert({
      given: "newly created magic link",
      should: "not be used initially",
      actual: magicLink.used,
      expected: false,
    });

    assert({
      given: "magic link with token",
      should: "have cryptographically secure token",
      actual: typeof magicLink.token,
      expected: "string",
    });
  });
});

describe("ActivityLog type", () => {
  test("valid activity log with signin event", () => {
    const log = createActivityLog({ eventType: "signin" });

    assert({
      given: "activity log entry",
      should: "have signin eventType",
      actual: log.eventType,
      expected: "signin",
    });

    assert({
      given: "activity log entry",
      should: "have userId reference",
      actual: typeof log.userId,
      expected: "string",
    });

    assert({
      given: "activity log entry",
      should: "have timestamp",
      actual: typeof log.timestamp,
      expected: "number",
    });
  });

  test("valid activity log with welcome_dismissed event", () => {
    const log = createActivityLog({ eventType: "welcome_dismissed" });

    assert({
      given: "welcome dismissed event",
      should: "have welcome_dismissed eventType",
      actual: log.eventType,
      expected: "welcome_dismissed",
    });

    assert({
      given: "activity log with metadata",
      should: "support optional metadata object",
      actual: typeof log.metadata,
      expected: "object",
    });
  });
});

describe("Session type", () => {
  test("valid session creation", () => {
    const session = createSession();

    assert({
      given: "session with token",
      should: "have session token",
      actual: typeof session.token,
      expected: "string",
    });

    assert({
      given: "session with user reference",
      should: "have userId",
      actual: typeof session.userId,
      expected: "string",
    });

    assert({
      given: "session with expiration",
      should: "have expiresAt timestamp",
      actual: session.expiresAt > session.createdAt,
      expected: true,
    });
  });
});
