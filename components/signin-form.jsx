import { useState } from "react";

/**
 * Sign in form component with passkey and email magic link options
 * @param {Object} props
 * @param {Array} props.passkeys - List of user's registered passkeys
 * @param {Function} props.onPasskeySelect - Handler for passkey selection
 * @param {Function} props.onEmailSubmit - Handler for email submission
 * @returns {JSX.Element}
 */
const SignInForm = ({ passkeys = [], onPasskeySelect, onEmailSubmit }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
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
        setMessage(data.message || "Magic link sent to your email");
        setEmail("");
        onEmailSubmit?.(email);
      } else {
        if (data.error?.includes("not found") || data.error?.includes("doesn't exist")) {
          setError("Email not found. Would you like to sign up instead?");
        } else {
          setError(data.error || "Failed to send magic link");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handlePasskeyClick = async (passkeyId) => {
    setMessage("");
    setError("");
    onPasskeySelect?.(passkeyId);
  };

  return (
    <div className="signin-form">
      <h2>Sign in with a passkey</h2>

      {passkeys.length > 0 && (
        <div className="passkey-list">
          {passkeys.map((passkey) => (
            <button
              key={passkey.id}
              type="button"
              onClick={() => handlePasskeyClick(passkey.id)}
              className="passkey-button"
            >
              {passkey.deviceName}
            </button>
          ))}
        </div>
      )}

      <div className="email-signin">
        <h3>Sign in with email</h3>
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="email-input"
            required
          />
          <button type="submit" className="submit-button">
            Send Signin Link
          </button>
        </form>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SignInForm;
