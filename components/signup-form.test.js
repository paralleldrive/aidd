import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

// Sign up form component factory
const createSignUpForm = ({
  onSubmit = () => {},
  email = "",
  name = "",
} = {}) => ({
  emailLabel: "Your email",
  emailPlaceholder: "user@example.com",
  nameLabel: "Your name",
  namePlaceholder: "Alex Archer",
  submitButtonText: "Send Signin Link",
  onSubmit,
  email,
  name,
});

describe("SignUpForm component", () => {
  test("basic form structure", () => {
    const form = createSignUpForm();

    assert({
      given: "signup form",
      should: "have email label",
      actual: form.emailLabel,
      expected: "Your email",
    });

    assert({
      given: "signup form",
      should: "have email placeholder",
      actual: form.emailPlaceholder,
      expected: "user@example.com",
    });

    assert({
      given: "signup form",
      should: "have name label",
      actual: form.nameLabel,
      expected: "Your name",
    });

    assert({
      given: "signup form",
      should: "have name placeholder",
      actual: form.namePlaceholder,
      expected: "Alex Archer",
    });

    assert({
      given: "signup form",
      should: "have submit button text",
      actual: form.submitButtonText,
      expected: "Send Signin Link",
    });
  });

  test("form submission handler", () => {
    let submittedData = null;
    const onSubmit = (data) => {
      submittedData = data;
    };
    const form = createSignUpForm({
      email: "newuser@example.com",
      name: "Alex Archer",
      onSubmit,
    });

    form.onSubmit({ email: form.email, name: form.name });

    assert({
      given: "form submission",
      should: "call submit handler with email",
      actual: submittedData.email,
      expected: "newuser@example.com",
    });

    assert({
      given: "form submission",
      should: "call submit handler with name",
      actual: submittedData.name,
      expected: "Alex Archer",
    });
  });

  test("form with user input", () => {
    const form = createSignUpForm({
      email: "test@example.com",
      name: "Test User",
    });

    assert({
      given: "form with email input",
      should: "have email value",
      actual: form.email,
      expected: "test@example.com",
    });

    assert({
      given: "form with name input",
      should: "have name value",
      actual: form.name,
      expected: "Test User",
    });
  });
});
