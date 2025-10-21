# Authentication Components

Reference implementations for passwordless authentication UI components.

## SignInForm

A React component for passwordless sign-in with passkey and magic link options.

### Features

- **Passkey Authentication**: Lists user's registered passkeys with device names
- **Email Magic Link**: Send secure one-time signin links via email
- **Error Handling**: Displays validation errors and API responses
- **Responsive Design**: Ready for styling with your design system

### Usage

```jsx
import SignInForm from './components/signin-form';

const SignInPage = () => {
  const passkeys = [
    { id: 'pk1', deviceName: 'Chrome on MacBook', createdAt: Date.now() },
    { id: 'pk2', deviceName: 'Safari on iPhone', createdAt: Date.now() - 86400000 }
  ];

  const handlePasskeySelect = async (passkeyId) => {
    // Initiate WebAuthn authentication flow
    console.log('Selected passkey:', passkeyId);
  };

  const handleEmailSubmit = (email) => {
    // Handle successful magic link send
    console.log('Magic link sent to:', email);
  };

  return (
    <SignInForm
      passkeys={passkeys}
      onPasskeySelect={handlePasskeySelect}
      onEmailSubmit={handleEmailSubmit}
    />
  );
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `passkeys` | `Array<Passkey>` | No | List of registered passkeys with `id`, `deviceName`, `createdAt` |
| `onPasskeySelect` | `Function` | No | Callback when passkey is selected: `(passkeyId: string) => void` |
| `onEmailSubmit` | `Function` | No | Callback when email magic link is sent: `(email: string) => void` |

### API Integration

The component calls `/api/auth/signin` endpoint:

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Email not found"
}
```

### Styling

Add CSS for these classes:

- `.signin-form` - Main container
- `.passkey-list` - Passkey button container
- `.passkey-button` - Individual passkey button
- `.email-signin` - Email form container
- `.email-input` - Email input field
- `.submit-button` - Submit button
- `.success-message` - Success feedback
- `.error-message` - Error feedback

### Testing

```bash
npm test components/signin-form
```

Tests cover:
- Form structure and headings
- Passkey list display with device names
- Email validation
- API error handling (email not found, network errors)
- Callback invocation

---

## SignUpForm

A React component for new user registration with email and name collection.

### Features

- **Email & Name Collection**: Captures user information for account creation
- **Validation**: Client-side validation for email format and name length
- **Magic Link Delivery**: Sends signin link via email after successful signup
- **Error Handling**: Displays validation errors and API responses
- **Responsive Design**: Ready for styling with your design system

### Usage

```jsx
import SignUpForm from './components/signup-form';

const SignUpPage = () => {
  const handleSubmit = ({ email, name, userId }) => {
    // Handle successful signup
    console.log('Account created for:', email, name);
    console.log('User ID:', userId);
  };

  return <SignUpForm onSubmit={handleSubmit} />;
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | `Function` | No | Callback when signup succeeds: `({ email, name, userId }) => void` |

### API Integration

The component calls `/api/auth/signup` endpoint:

**Request**:
```json
{
  "email": "user@example.com",
  "name": "Alex Archer"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": "user123"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Email already exists"
}
```

### Validation Rules

- **Email**: Must contain `@` symbol
- **Name**: Minimum 2 characters (excluding whitespace)

### Styling

Add CSS for these classes:

- `.signup-form` - Main container
- `.form-field` - Form field wrapper
- `.email-input` - Email input field
- `.name-input` - Name input field
- `.submit-button` - Submit button
- `.success-message` - Success feedback
- `.error-message` - Error feedback

### Testing

```bash
npm test components/signup-form
```

Tests cover:
- Form structure with email and name fields
- Email validation (format, empty)
- Name validation (length, whitespace)
- API integration with proper request body
- Error handling (duplicate email, network errors)
- Callback invocation with user data
