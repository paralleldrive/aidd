import { useState } from "react";
import { validateEmail } from "../lib/validation.js";
import { signin, getSecureErrorMessage } from "../lib/auth-service.js";

/**
 * Sign in form component with passkey and email magic link options
 * @param {Object} props
 * @param {Array} props.passkeys - List of user's registered passkeys
 * @param {Function} props.onPasskeySelect - Handler for passkey selection
 * @param {Function} props.onEmailSubmit - Handler for successful email submission
 * @returns {JSX.Element}
 */
const SignInForm = ({ passkeys = [], onPasskeySelect, onEmailSubmit }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      await signin(email);
      // Always show generic message for security
      setMessage(getSecureErrorMessage("auth"));
      setEmail("");
      onEmailSubmit?.(email);
    } catch (err) {
      setError(err.message || getSecureErrorMessage("network"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyClick = async (passkeyId) => {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await onPasskeySelect?.(passkeyId);
    } catch (err) {
      setError("Passkey authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-form">
      <h2 id="signin-heading">Sign in with a passkey</h2>

      {passkeys.length > 0 && (
        <div className="passkey-list" role="group" aria-labelledby="signin-heading">
          {passkeys.map((passkey) => (
            <button
              key={passkey.id}
              type="button"
              onClick={() => handlePasskeyClick(passkey.id)}
              className="passkey-button"
              disabled={loading}
              aria-label={`Sign in with ${passkey.deviceName}`}
            >
              {passkey.deviceName}
            </button>
          ))}
        </div>
      )}

      <div className="email-signin">
        <h3 id="email-signin-heading">Sign in with email</h3>
        <form onSubmit={handleEmailSubmit} aria-labelledby="email-signin-heading">
          <label htmlFor="signin-email" className="visually-hidden">
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="email-input"
            required
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? "signin-error" : undefined}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Sending..." : "Send Signin Link"}
          </button>
        </form>
      </div>

      {message && (
        <div className="success-message" role="status" aria-live="polite">
          {message}
        </div>
      )}
      {error && (
        <div id="signin-error" className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
};

export default SignInForm;
