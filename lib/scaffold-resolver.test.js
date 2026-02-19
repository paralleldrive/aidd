import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { resolveExtension } from "./scaffold-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const noLog = () => {};
const noConfirm = async () => true;

// mockClone simulates a successful git clone by writing the minimum files a
// scaffold needs into destPath, matching what a real repo would contain.
const mockClone = async (_url, destPath) => {
  await fs.ensureDir(path.join(destPath, "bin"));
  await fs.writeFile(path.join(destPath, "README.md"), "# Remote Scaffold");
  await fs.writeFile(
    path.join(destPath, "SCAFFOLD-MANIFEST.yml"),
    "steps:\n  - run: echo hello\n",
  );
};

describe("resolveExtension - named scaffold", () => {
  test("resolves README path to ai/scaffolds/<type>/README.md", async () => {
    const paths = await resolveExtension({
      type: "scaffold-example",
      folder: "/tmp/test-named",
      packageRoot: __dirname,
      log: noLog,
    });

    assert({
      given: "a named scaffold type",
      should: "resolve readmePath to ai/scaffolds/<type>/README.md",
      actual: paths.readmePath.endsWith(
        path.join("ai", "scaffolds", "scaffold-example", "README.md"),
      ),
      expected: true,
    });
  });

  test("resolves manifest path to ai/scaffolds/<type>/SCAFFOLD-MANIFEST.yml", async () => {
    const paths = await resolveExtension({
      type: "scaffold-example",
      folder: "/tmp/test-named",
      packageRoot: __dirname,
      log: noLog,
    });

    assert({
      given: "a named scaffold type",
      should:
        "resolve manifestPath to ai/scaffolds/<type>/SCAFFOLD-MANIFEST.yml",
      actual: paths.manifestPath.endsWith(
        path.join(
          "ai",
          "scaffolds",
          "scaffold-example",
          "SCAFFOLD-MANIFEST.yml",
        ),
      ),
      expected: true,
    });
  });

  test("resolves extensionJsPath to ai/scaffolds/<type>/bin/extension.js", async () => {
    const paths = await resolveExtension({
      type: "scaffold-example",
      folder: "/tmp/test-named",
      packageRoot: __dirname,
      log: noLog,
    });

    assert({
      given: "a named scaffold type",
      should: "resolve extensionJsPath to ai/scaffolds/<type>/bin/extension.js",
      actual: paths.extensionJsPath.endsWith(
        path.join("ai", "scaffolds", "scaffold-example", "bin", "extension.js"),
      ),
      expected: true,
    });
  });

  test("displays README contents when README exists", async () => {
    const logged = [];
    await resolveExtension({
      type: "scaffold-example",
      folder: "/tmp/test-named",
      packageRoot: __dirname,
      log: (msg) => logged.push(msg),
    });

    assert({
      given: "a named scaffold with a README.md",
      should: "display README contents to the user",
      actual: logged.length > 0,
      expected: true,
    });
  });
});

describe("resolveExtension - file:// URI", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-file-uri-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    await fs.writeFile(path.join(tempDir, "README.md"), "# Test Scaffold");
    await fs.writeFile(
      path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
      "steps:\n  - run: echo hello\n",
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("resolves paths from local file:// URI without copying", async () => {
    const uri = `file://${tempDir}`;
    const paths = await resolveExtension({
      type: uri,
      folder: "/tmp/test-file-uri",
      log: noLog,
    });

    assert({
      given: "a file:// URI",
      should: "resolve readmePath to the local path README.md",
      actual: paths.readmePath,
      expected: path.join(tempDir, "README.md"),
    });
  });

  test("resolves manifest path from file:// URI", async () => {
    const uri = `file://${tempDir}`;
    const paths = await resolveExtension({
      type: uri,
      folder: "/tmp/test-file-uri",
      log: noLog,
    });

    assert({
      given: "a file:// URI",
      should: "resolve manifestPath to the local SCAFFOLD-MANIFEST.yml",
      actual: paths.manifestPath,
      expected: path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
    });
  });

  test("displays README contents from file:// URI", async () => {
    const uri = `file://${tempDir}`;
    const logged = [];
    await resolveExtension({
      type: uri,
      folder: "/tmp/test-file-uri",
      log: (msg) => logged.push(msg),
    });

    assert({
      given: "a file:// URI scaffold with README.md",
      should: "display README contents to the user",
      actual: logged.join("").includes("Test Scaffold"),
      expected: true,
    });
  });
});

describe("resolveExtension - HTTP/HTTPS URI", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-http-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("warns user about remote code before cloning", async () => {
    const warnings = [];
    const mockConfirm = async (msg) => {
      warnings.push(msg);
      return true;
    };

    await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      clone: mockClone,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "show a warning before cloning remote code",
      actual: warnings.length > 0 && warnings[0].includes("Warning"),
      expected: true,
    });
  });

  test("includes the URI in the warning", async () => {
    const warnings = [];
    const mockConfirm = async (msg) => {
      warnings.push(msg);
      return true;
    };

    await resolveExtension({
      type: "https://example.com/my-scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      clone: mockClone,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "include the URI in the warning message",
      actual: warnings[0].includes("https://example.com/my-scaffold"),
      expected: true,
    });
  });

  test("cancels if user does not confirm", async () => {
    const mockConfirm = async () => false;

    let errorThrown = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold",
        folder: tempDir,
        confirm: mockConfirm,
        clone: mockClone,
        log: noLog,
      });
    } catch (err) {
      errorThrown = err;
    }

    assert({
      given: "user refuses remote code confirmation",
      should: "throw an error cancelling the operation",
      actual: errorThrown?.message.includes("cancelled"),
      expected: true,
    });
  });

  test("clones the entire repo into <folder>/.aidd/scaffold/", async () => {
    const cloned = [];
    const trackingClone = async (url, destPath) => {
      cloned.push({ destPath, url });
      await mockClone(url, destPath);
    };

    const scaffoldDir = path.join(tempDir, ".aidd/scaffold");

    await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      clone: trackingClone,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "call clone with the repo URL",
      actual: cloned[0]?.url,
      expected: "https://example.com/scaffold",
    });

    assert({
      given: "an HTTPS URI",
      should: "clone into <folder>/.aidd/scaffold/",
      actual: cloned[0]?.destPath,
      expected: scaffoldDir,
    });
  });

  test("returns paths rooted at <folder>/.aidd/scaffold/", async () => {
    const paths = await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      clone: mockClone,
      log: noLog,
    });

    const scaffoldDir = path.join(tempDir, ".aidd/scaffold");

    assert({
      given: "an HTTPS URI with a cloned repo",
      should: "return readmePath rooted at .aidd/scaffold/",
      actual: paths.readmePath.startsWith(scaffoldDir),
      expected: true,
    });
  });

  test("leaves cloned repo in place after resolving", async () => {
    const paths = await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      clone: mockClone,
      log: noLog,
    });

    const readmeExists = await fs.pathExists(paths.readmePath);

    assert({
      given: "a cloned extension",
      should: "leave repo in place at <folder>/.aidd/scaffold/",
      actual: readmeExists,
      expected: true,
    });
  });
});

describe("resolveExtension - default scaffold resolution", () => {
  test("uses next-shadcn when no type and no env var", async () => {
    const originalEnv = process.env.AIDD_CUSTOM_EXTENSION_URI;
    delete process.env.AIDD_CUSTOM_EXTENSION_URI;

    const paths = await resolveExtension({
      folder: "/tmp/test-default",
      packageRoot: __dirname,
      log: noLog,
    });

    process.env.AIDD_CUSTOM_EXTENSION_URI = originalEnv;

    assert({
      given: "no type and no AIDD_CUSTOM_EXTENSION_URI env var",
      should: "resolve to next-shadcn named scaffold",
      actual: paths.readmePath.includes("next-shadcn"),
      expected: true,
    });
  });

  test("uses AIDD_CUSTOM_EXTENSION_URI env var when set and no type given", async () => {
    let tempDir;
    try {
      tempDir = path.join(os.tmpdir(), `aidd-env-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, "README.md"), "# Env Scaffold");
      await fs.writeFile(
        path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
        "steps:\n",
      );

      process.env.AIDD_CUSTOM_EXTENSION_URI = `file://${tempDir}`;
      const logged = [];

      const paths = await resolveExtension({
        folder: "/tmp/test-env",
        log: (msg) => logged.push(msg),
      });

      assert({
        given: "AIDD_CUSTOM_EXTENSION_URI set to a file:// URI",
        should: "use the env var URI as the extension source",
        actual: paths.readmePath,
        expected: path.join(tempDir, "README.md"),
      });
    } finally {
      delete process.env.AIDD_CUSTOM_EXTENSION_URI;
      if (tempDir) await fs.remove(tempDir);
    }
  });
});

describe("resolveExtension - manifest existence validation", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-manifest-check-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("throws ScaffoldValidationError when file:// scaffold has no SCAFFOLD-MANIFEST.yml", async () => {
    // tempDir has no SCAFFOLD-MANIFEST.yml
    const uri = `file://${tempDir}`;

    let error = null;
    try {
      await resolveExtension({ type: uri, folder: "/tmp/test", log: noLog });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a file:// scaffold directory with no SCAFFOLD-MANIFEST.yml",
      should: "throw ScaffoldValidationError before returning paths",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("includes the missing path in the error message for file:// scaffolds", async () => {
    const uri = `file://${tempDir}`;

    let error = null;
    try {
      await resolveExtension({ type: uri, folder: "/tmp/test", log: noLog });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a file:// scaffold directory with no SCAFFOLD-MANIFEST.yml",
      should: "include SCAFFOLD-MANIFEST.yml in the error message",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("SCAFFOLD-MANIFEST.yml"),
      expected: true,
    });
  });

  test("throws ScaffoldValidationError when cloned HTTP scaffold has no SCAFFOLD-MANIFEST.yml", async () => {
    // mockClone that writes NO manifest file
    const cloneWithoutManifest = async (_url, destPath) => {
      await fs.ensureDir(destPath);
      await fs.writeFile(path.join(destPath, "README.md"), "# No Manifest");
    };

    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold",
        folder: tempDir,
        confirm: noConfirm,
        clone: cloneWithoutManifest,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "an HTTP scaffold clone that contains no SCAFFOLD-MANIFEST.yml",
      should: "throw ScaffoldValidationError mentioning the URI",
      actual:
        error?.cause?.code === "SCAFFOLD_VALIDATION_ERROR" &&
        typeof error?.message === "string" &&
        error.message.includes("https://example.com/scaffold"),
      expected: true,
    });
  });
});
