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
