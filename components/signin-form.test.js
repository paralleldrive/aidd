import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

// Sign in form component factory
const createSignInForm = ({
  passkeys = [],
  onPasskeySelect = () => {},
  onEmailSubmit = () => {},
  email = "",
} = {}) => ({
  heading: "Sign in with a passkey",
  passkeys,
  emailPlaceholder: "user@example.com",
  submitButtonText: "Send Signin Link",
  onPasskeySelect,
  onEmailSubmit,
  email,
  hasPasskeys: passkeys.length > 0,
});

describe("SignInForm component", () => {
  test("basic form structure", () => {
    const form = createSignInForm();

    assert({
      given: "sign in form",
      should: "display passkey heading",
      actual: form.heading,
      expected: "Sign in with a passkey",
    });

    assert({
      given: "sign in form",
      should: "have email placeholder",
      actual: form.emailPlaceholder,
      expected: "user@example.com",
    });

    assert({
      given: "sign in form",
      should: "have submit button text",
      actual: form.submitButtonText,
      expected: "Send Signin Link",
    });
  });

  test("user with passkeys", () => {
    const passkeys = [
      { id: "pk1", deviceName: "Chrome on MacBook", createdAt: Date.now() },
      {
        id: "pk2",
        deviceName: "Safari on iPhone",
        createdAt: Date.now() - 86400000,
      },
    ];
    const form = createSignInForm({ passkeys });

    assert({
      given: "user with registered passkeys",
      should: "display passkey list",
      actual: form.passkeys.length,
      expected: 2,
    });

    assert({
      given: "passkey in list",
      should: "show device name",
      actual: form.passkeys[0].deviceName,
      expected: "Chrome on MacBook",
    });

    assert({
      given: "form with passkeys",
      should: "indicate passkeys exist",
      actual: form.hasPasskeys,
      expected: true,
    });
  });

  test("user without passkeys", () => {
    const form = createSignInForm({ passkeys: [] });

    assert({
      given: "user without passkeys",
      should: "have empty passkey list",
      actual: form.passkeys.length,
      expected: 0,
    });

    assert({
      given: "form without passkeys",
      should: "indicate no passkeys",
      actual: form.hasPasskeys,
      expected: false,
    });
  });

  test("passkey selection handler", () => {
    let selectedPasskeyId = null;
    const onPasskeySelect = (id) => {
      selectedPasskeyId = id;
    };
    const passkeys = [
      { id: "pk1", deviceName: "Chrome on MacBook", createdAt: Date.now() },
    ];
    const form = createSignInForm({ passkeys, onPasskeySelect });

    form.onPasskeySelect("pk1");

    assert({
      given: "passkey selection",
      should: "call selection handler with passkey id",
      actual: selectedPasskeyId,
      expected: "pk1",
    });
  });

  test("email submission handler", () => {
    let submittedEmail = null;
    const onEmailSubmit = (email) => {
      submittedEmail = email;
    };
    const form = createSignInForm({ email: "test@example.com", onEmailSubmit });

    form.onEmailSubmit(form.email);

    assert({
      given: "email submission",
      should: "call submit handler with email",
      actual: submittedEmail,
      expected: "test@example.com",
    });
  });
});
