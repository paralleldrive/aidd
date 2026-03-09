import fs from "fs-extra";

import { parseManifest } from "./scaffold-runner.js";

// Verifies that a resolved scaffold conforms to all structural requirements
// before any steps are executed. Returns { valid, errors } so callers can
// report all problems at once rather than failing one at a time.
/** @param {{ manifestPath: string }} options */
const verifyScaffold = async ({ manifestPath }) => {
  const errors = [];

  const manifestExists = await fs.pathExists(manifestPath);
  if (!manifestExists) {
    errors.push(`SCAFFOLD-MANIFEST.yml not found: ${manifestPath}`);
    return { errors, valid: false };
  }

  let steps;
  try {
    const content = await fs.readFile(manifestPath, "utf-8");
    steps = parseManifest(content);
  } catch (err) {
    errors.push(
      `Invalid manifest: ${/** @type {any} */ (err)?.message ?? String(err)}`,
    );
    return { errors, valid: false };
  }

  if (steps.length === 0) {
    errors.push("Manifest contains no steps — scaffold would do nothing");
    return { errors, valid: false };
  }

  return { errors: [], valid: true };
};

export { verifyScaffold };
