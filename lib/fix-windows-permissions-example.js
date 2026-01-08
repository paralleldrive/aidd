/**
 * Example: How to use the opt-in Windows permission remediation
 *
 * This demonstrates the fixWindowsPermissions() function added to vibe-auth.js
 * for remediating insecure Windows file permissions on credential files.
 */
import { fixWindowsPermissions, defaultConfigPath } from "./vibe-auth.js";

/**
 * Example 1: Fix permissions with verbose logging
 */
async function fixPermissionsVerbose() {
  const configPath = defaultConfigPath();
  console.log(`\nAttempting to fix permissions on: ${configPath}\n`);

  const result = fixWindowsPermissions(configPath, { verbose: true });

  if (result.success) {
    console.log("\n✓ Permissions fixed successfully!");
  } else {
    console.error("\n✗ Failed to fix permissions:");
    console.error(result.warning);
  }

  return result;
}

/**
 * Example 2: Fix permissions silently (no logs)
 */
async function fixPermissionsSilent() {
  const configPath = defaultConfigPath();

  const result = fixWindowsPermissions(configPath);

  if (result.success) {
    console.log("✓ Permissions secured");
  } else {
    console.error("✗ Could not secure permissions");
    console.error(result.warning);
  }

  return result;
}

/**
 * Example 3: Interactive permission fix with user confirmation
 */
async function fixPermissionsInteractive() {
  const readline = await import("readline");
  const configPath = defaultConfigPath();

  console.log(`\nCredential file: ${configPath}`);
  console.log("This file has insecure permissions (world-readable).\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Fix permissions now? [y/N]: ", (answer) => {
      rl.close();

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        console.log("\nFixing permissions...");
        const result = fixWindowsPermissions(configPath, { verbose: true });

        if (result.success) {
          console.log("\n✓ Permissions fixed successfully!");
        } else {
          console.error("\n✗ Failed to fix permissions:");
          console.error(result.warning);
        }

        resolve(result);
      } else {
        console.log("\nSkipped. To fix manually, run:");
        console.log(
          `  icacls "${configPath}" /inheritance:r /grant:r "%USERNAME%:(F)"`,
        );
        resolve({ success: false, skipped: true });
      }
    });
  });
}

/**
 * Example 4: Error handling with graceful degradation
 */
async function fixPermissionsWithErrorHandling() {
  const configPath = defaultConfigPath();

  try {
    const result = fixWindowsPermissions(configPath, { verbose: true });

    if (!result.success) {
      // Log warning but continue execution - don't crash
      console.warn("Warning: Could not secure file permissions");
      console.warn(result.warning);
      console.warn("Continuing anyway...");
    }

    return result;
  } catch (err) {
    // Should never reach here - fixWindowsPermissions doesn't throw
    console.error("Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// Run examples based on command line argument
const example = process.argv[2] || "interactive";

switch (example) {
  case "verbose":
    fixPermissionsVerbose();
    break;
  case "silent":
    fixPermissionsSilent();
    break;
  case "interactive":
    fixPermissionsInteractive();
    break;
  case "error-handling":
    fixPermissionsWithErrorHandling();
    break;
  default:
    console.log("Usage: node fix-windows-permissions-example.js [example]");
    console.log("Examples: verbose, silent, interactive, error-handling");
}
