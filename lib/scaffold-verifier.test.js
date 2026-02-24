import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { verifyScaffold } from "./scaffold-verifier.js";

describe("verifyScaffold", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-verifier-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("returns valid=true for a well-formed manifest", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps:\n  - run: npm init -y\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with one valid run step",
      should: "return valid true with no errors",
      actual: result,
      expected: { valid: true, errors: [] },
    });
  });

  test("returns valid=false when manifest file does not exist", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a path where no manifest file exists",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "a path where no manifest file exists",
      should: "include a descriptive error message",
      actual: result.errors.some((e) => e.includes("not found")),
      expected: true,
    });
  });

  test("returns valid=false when steps is not an array", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps: not-an-array\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest where steps is a string",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "a manifest where steps is a string",
      should: "include an error message mentioning the problem",
      actual: result.errors.length > 0,
      expected: true,
    });
  });

  test("returns valid=false when a step has no recognized keys", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps:\n  - unknown: value\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with an unrecognized step shape",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });

  test("returns valid=false when manifest has no steps and no extension", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps: []\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with an empty steps array and no extension.js",
      should: "return valid false (scaffold would do nothing)",
      actual: result.valid,
      expected: false,
    });
  });

  test("returns valid=true when manifest has no steps but has extension.js", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    const extensionPath = path.join(tempDir, "bin/extension.js");

    await fs.writeFile(manifestPath, "steps: []\n");
    await fs.ensureDir(path.dirname(extensionPath));
    await fs.writeFile(extensionPath, "console.log('extension');\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with no steps but with bin/extension.js",
      should: "return valid true (extension can still do work)",
      actual: result.valid,
      expected: true,
    });
  });

  test("returns valid=true for manifest with prompt steps", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - prompt: Set up the project\n",
    );

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with a valid prompt step",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("returns valid=true for manifest with mixed run and prompt steps", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npm init -y\n  - prompt: Configure the project\n",
    );

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with mixed run and prompt steps",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("returns valid=false and includes error message when a step item is a bare string", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps:\n  - just-a-string\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest where a step is a bare string",
      should: "return valid false with an error message",
      actual: result.valid === false && result.errors.length > 0,
      expected: true,
    });
  });
});
