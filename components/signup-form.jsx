import { useState } from "react";

/**
 * Sign up form component for new user registration
 * @param {Object} props
 * @param {Function} props.onSubmit - Handler for form submission
 * @returns {JSX.Element}
 */
const SignUpForm = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!name || name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Magic link sent to your email");
        setEmail("");
        setName("");
        onSubmit?.({ email, name, userId: data.userId });
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="signup-form">
      <h2>Create your account</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Your email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="email-input"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Archer"
            className="name-input"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Send Signin Link
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SignUpForm;
