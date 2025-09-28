#!/usr/bin/env node

import { updateLatestTag } from "./release-helpers.js";

// Hook script called by release-it after successful release
// Usage: node lib/update-latest-tag-hook.js <version>
const main = async () => {
  const version = process.argv[2];

  if (!version) {
    console.error("❌ Version argument required");
    process.exit(1);
  }

  console.log(`\n🔄 Evaluating latest tag update for version ${version}...`);

  try {
    const result = await updateLatestTag({
      version: version.replace(/^v/, ""), // Remove 'v' prefix if present
      dryRun: false,
    });

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`ℹ️  ${result.message}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update latest tag: ${error.message}`);
    // Don't exit with error - we don't want to break the release process
  }
};

main();
