import { useState } from "react";
import { validateEmail, validateName } from "../lib/validation.js";
import { signup, getSecureErrorMessage } from "../lib/auth-service.js";

/**
 * Sign up form component for new user registration
 * @param {Object} props
 * @param {Function} props.onSubmit - Handler for successful form submission
 * @returns {JSX.Element}
 */
const SignUpForm = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setEmailError("");
    setNameError("");

    // Validate inputs
    let hasError = false;

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!validateName(name)) {
      setNameError("Please enter your name (minimum 2 characters)");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const data = await signup({ email, name });
      // Always show generic message for security
      setMessage(getSecureErrorMessage("auth"));
      setEmail("");
      setName("");
      onSubmit?.({ email, name, userId: data.userId });
    } catch (err) {
      setError(err.message || getSecureErrorMessage("network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-form">
      <h2 id="signup-heading">Create your account</h2>

      <form onSubmit={handleSubmit} aria-labelledby="signup-heading">
        <div className="form-field">
          <label htmlFor="signup-email">Your email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="email-input"
            required
            disabled={loading}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "signup-email-error" : undefined}
          />
          {emailError && (
            <div id="signup-email-error" className="field-error" role="alert">
              {emailError}
            </div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="signup-name">Your name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Archer"
            className="name-input"
            required
            disabled={loading}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "signup-name-error" : undefined}
          />
          {nameError && (
            <div id="signup-name-error" className="field-error" role="alert">
              {nameError}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Creating account..." : "Send Signin Link"}
        </button>
      </form>

      {message && (
        <div className="success-message" role="status" aria-live="polite">
          {message}
        </div>
      )}
      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
};

export default SignUpForm;
