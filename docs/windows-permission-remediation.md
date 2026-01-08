# Windows Credential Permission Remediation

## Overview

This document describes the opt-in Windows ACL remediation capability added to `lib/vibe-auth.js` for securing credential files on Windows systems.

## Problem

Windows credential files (e.g., `C:\Users\<user>\AppData\Roaming\vibecodr\cli.json`) may have insecure permissions that allow "Everyone" or "BUILTIN\Users" groups to read them. This is a security risk similar to having `chmod 644` permissions on Unix systems.

## Solution

The implementation provides:

1. **Detection**: `checkWindowsPermissions()` - Detects insecure ACLs
2. **Remediation**: `fixWindowsPermissions()` - Removes world-readable access (OPT-IN)
3. **Integration**: Automatic detection during `ensureVibecodrAuth()` with clear fix instructions

## Key Design Decisions

### Opt-In, Never Automatic

The remediation is **NEVER** automatic. It must be explicitly called by the user or code:

```javascript
import { fixWindowsPermissions } from './vibe-auth.js';

// User must explicitly call this
const result = fixWindowsPermissions(filePath, { verbose: true });
```

**Rationale**: Respects user's system. Auto-fixing permissions could:
- Break existing workflows that rely on shared access
- Cause confusion if permissions change without user knowledge
- Violate principle of least surprise

### Graceful Degradation

If `icacls` fails or permissions cannot be verified, the system:
- Warns but doesn't crash
- Assumes secure to avoid blocking legitimate usage
- Provides manual remediation instructions

**Rationale**: Availability over perfect security. Better to warn and continue than to block users.

### Clear User Feedback

Error messages include:
- What's wrong (e.g., "Everyone:(R)" detected)
- How to fix it (automated function call or manual `icacls` command)
- Why it matters (security risk)

**Rationale**: Users need to understand the security issue and how to fix it.

## API Reference

### `checkWindowsPermissions(filePath)`

**Purpose**: Detect if a Windows file has insecure permissions.

**Returns**:
```javascript
{
  secure: boolean,         // true if no world-readable ACLs found
  details?: string,        // Description of insecure entries (if any)
  warning?: string         // Warning if verification failed
}
```

**Example**:
```javascript
import { _testOnly } from './vibe-auth.js';

const check = _testOnly.checkWindowsPermissions('C:\\path\\to\\file.json');

if (!check.secure) {
  console.error('Insecure permissions detected:');
  console.error(check.details);
}
```

**Detects**:
- `Everyone:` - All users on the system
- `BUILTIN\Users:` - All interactive users
- `NT AUTHORITY\Authenticated Users:` - All authenticated users

### `fixWindowsPermissions(filePath, options)`

**Purpose**: Fix insecure Windows file permissions by removing world-readable access.

**Parameters**:
- `filePath` (string): Path to the file to fix
- `options` (object, optional):
  - `verbose` (boolean): Log icacls commands being run (default: false)

**Returns**:
```javascript
{
  success: boolean,        // true if fix succeeded
  warning?: string,        // Error message if fix failed
  commandRun: string       // The icacls command that was executed
}
```

**Example**:
```javascript
import { fixWindowsPermissions } from './vibe-auth.js';

// With verbose logging (shows icacls command)
const result = fixWindowsPermissions('C:\\path\\to\\file.json', { verbose: true });

if (result.success) {
  console.log('✓ Permissions fixed!');
} else {
  console.error('✗ Failed:', result.warning);
}
```

**What it does**:
1. Removes all inherited permissions (`/inheritance:r`)
2. Grants only the current user full control (`/grant:r %USERNAME%:(F)`)
3. Logs the command if `verbose: true`
4. Returns error details if it fails (doesn't throw)

### Error Detection in `ensureVibecodrAuth()`

When reading a config file on Windows, `ensureVibecodrAuth()` automatically checks permissions and throws `CONFIG_READ_ERROR` if insecure:

```javascript
import { ensureVibecodrAuth } from './vibe-auth.js';

try {
  const auth = await ensureVibecodrAuth();
} catch (error) {
  if (error.cause?.code === 'CONFIG_READ_ERROR') {
    // Error message includes:
    // 1. What's wrong: "File has world-readable permissions:\n  Everyone:(R)"
    // 2. How to fix: "To fix, run one of:\n  1. Automated: Call fixWindowsPermissions()..."
    console.error(error.message);
  }
}
```

## Usage Patterns

### Pattern 1: Interactive Prompt

```javascript
import readline from 'readline';
import { fixWindowsPermissions, defaultConfigPath } from './vibe-auth.js';

const configPath = defaultConfigPath();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Credentials have insecure permissions. Fix now? [y/N]: ', (answer) => {
  rl.close();

  if (answer.toLowerCase() === 'y') {
    const result = fixWindowsPermissions(configPath, { verbose: true });

    if (!result.success) {
      console.error('Failed to fix permissions:', result.warning);
    }
  }
});
```

### Pattern 2: CLI Flag

```javascript
// In CLI tool
if (options.fixPermissions) {
  const result = fixWindowsPermissions(configPath, { verbose: true });

  if (result.success) {
    console.log('Permissions secured.');
  } else {
    console.warn('Could not secure permissions:', result.warning);
    process.exit(1);
  }
}
```

### Pattern 3: Catch and Offer Fix

```javascript
import { ensureVibecodrAuth, fixWindowsPermissions } from './vibe-auth.js';

try {
  const auth = await ensureVibecodrAuth();
} catch (error) {
  if (error.cause?.code === 'CONFIG_READ_ERROR' &&
      error.message.includes('insecure Windows permissions')) {

    console.error('Error:', error.message);
    console.log('\nAttempting to fix permissions...');

    const result = fixWindowsPermissions(error.configPath, { verbose: true });

    if (result.success) {
      console.log('✓ Fixed! Please try again.');
      process.exit(0);
    } else {
      console.error('✗ Could not fix automatically:', result.warning);
      process.exit(1);
    }
  }

  throw error;
}
```

## Implementation Details

### icacls Commands Used

**Detection** (`checkWindowsPermissions`):
```cmd
icacls "C:\path\to\file.json"
```

**Remediation** (`fixWindowsPermissions`):
```cmd
icacls "C:\path\to\file.json" /inheritance:r /grant:r "%USERNAME%:(F)"
```

**Flags**:
- `/inheritance:r` - Remove all inherited ACLs
- `/grant:r` - Replace (not add) permissions
- `%USERNAME%:(F)` - Grant full control to current user only

### Error Handling

The implementation follows the "fail loud" principle:

1. **Detection errors**: Return `{ secure: true, warning: "..." }` to avoid blocking
2. **Remediation errors**: Return `{ success: false, warning: "..." }` with manual instructions
3. **Never throws**: All functions return status objects instead of throwing

This ensures that:
- Permission issues don't crash the application
- Users always get actionable error messages
- Graceful degradation when `icacls` is unavailable or fails

## Testing

Comprehensive tests are in `lib/vibe-auth.test.js`:

- **Detection tests**: Verify that `Everyone`, `BUILTIN\Users`, and `NT AUTHORITY\Authenticated Users` are detected
- **Remediation tests**: Verify that `fixWindowsPermissions` calls `icacls` correctly
- **Integration tests**: Verify that `ensureVibecodrAuth` detects and reports insecure permissions
- **Error handling tests**: Verify graceful degradation when `icacls` fails

Run tests:
```bash
npm test -- lib/vibe-auth.test.js
```

## Security Considerations

### Why These Groups Are Insecure

- **Everyone**: Includes all users, including guest accounts and network users
- **BUILTIN\Users**: Includes all interactive users on the system
- **NT AUTHORITY\Authenticated Users**: Includes all users who have authenticated to the domain or local machine

If credential files are readable by these groups, any user on the system can steal authentication tokens.

### Why We Don't Auto-Fix

Auto-fixing could:
1. Break legitimate multi-user scenarios (rare but possible)
2. Change system state without user consent
3. Create confusion ("Why did my permissions change?")

The opt-in approach ensures users:
- Understand why permissions are being changed
- Consent to the change
- Can choose manual remediation if preferred

### What About Unix?

Unix systems use file mode bits (e.g., `chmod 600`). The existing `verifyFilePermissions()` function already enforces `0600` permissions on Unix and throws an error if they're wrong.

Windows needed equivalent detection because:
1. Windows doesn't use mode bits - it uses ACLs
2. Default Windows file permissions often include "Users" group
3. No equivalent to `chmod` for quick permission fixes

## Future Enhancements

Potential improvements (not implemented yet):

1. **CLI flag**: `aidd --vibe-login --fix-permissions`
2. **Auto-fix on write**: When creating new credential files, automatically secure them
3. **Periodic checks**: Check permissions on each auth operation and warn if they've changed
4. **Group policy detection**: Detect if corporate group policy prevents ACL changes

## References

- Microsoft icacls documentation: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls
- Windows ACL overview: https://learn.microsoft.com/en-us/windows/security/identity-protection/access-control/access-control
- Security best practices: Store credentials with minimal permissions (owner-only)
