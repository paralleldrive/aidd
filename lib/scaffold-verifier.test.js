import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, onTestFinished, test } from "vitest";

import { verifyScaffold } from "./scaffold-verifier.js";

const createTempDir = async () => {
  const dir = path.join(
    os.tmpdir(),
    `aidd-verifier-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.ensureDir(dir);
  onTestFinished(async () => fs.remove(dir));
  return dir;
};

describe("verifyScaffold", () => {
  test("returns valid=true for a well-formed manifest", async () => {
    const tempDir = await createTempDir();
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
    const tempDir = await createTempDir();
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a path where no manifest file exists",
      should: "return valid false with an error mentioning the manifest path",
      actual:
        result.valid === false &&
        result.errors.some((e) => e.includes(manifestPath)),
      expected: true,
    });
  });

  test("returns valid=false when steps is not an array", async () => {
    const tempDir = await createTempDir();
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
    const tempDir = await createTempDir();
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

  test("returns valid=false when manifest has no steps", async () => {
    const tempDir = await createTempDir();
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps: []\n");

    const result = await verifyScaffold({ manifestPath });

    assert({
      given: "a manifest with an empty steps array",
      should: "return valid false (scaffold would do nothing)",
      actual: result.valid,
      expected: false,
    });
  });

  test("returns valid=true for manifest with prompt steps", async () => {
    const tempDir = await createTempDir();
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
    const tempDir = await createTempDir();
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
    const tempDir = await createTempDir();
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
