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
const _noFetch = async () => null;

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

  test("warns user about remote code before downloading", async () => {
    const warnings = [];
    const mockConfirm = async (msg) => {
      warnings.push(msg);
      return true;
    };
    const mockFetch = async () => "# Remote README";

    await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      fetchText: mockFetch,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "show a warning before downloading remote code",
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
    const mockFetch = async () => "content";

    await resolveExtension({
      type: "https://example.com/my-scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      fetchText: mockFetch,
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
    const mockFetch = async () => "content";

    let errorThrown = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold",
        folder: tempDir,
        confirm: mockConfirm,
        fetchText: mockFetch,
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

  test("fetches README, manifest, and extension.js from remote URI", async () => {
    const fetched = [];
    const mockFetch = async (url) => {
      fetched.push(url);
      return `content for ${url}`;
    };

    await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      fetchText: mockFetch,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "fetch README.md from the URI",
      actual: fetched.some((url) => url.endsWith("README.md")),
      expected: true,
    });

    assert({
      given: "an HTTPS URI",
      should: "fetch SCAFFOLD-MANIFEST.yml from the URI",
      actual: fetched.some((url) => url.endsWith("SCAFFOLD-MANIFEST.yml")),
      expected: true,
    });

    assert({
      given: "an HTTPS URI",
      should: "fetch bin/extension.js from the URI",
      actual: fetched.some((url) => url.endsWith("bin/extension.js")),
      expected: true,
    });
  });

  test("saves fetched files to <folder>/.aidd/scaffold/", async () => {
    const mockFetch = async () => "# content";

    const paths = await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      fetchText: mockFetch,
      log: noLog,
    });

    const scaffoldDir = path.join(tempDir, ".aidd/scaffold");

    assert({
      given: "an HTTPS URI with fetched files",
      should: "save files into <folder>/.aidd/scaffold/",
      actual: paths.readmePath.startsWith(scaffoldDir),
      expected: true,
    });
  });

  test("leaves fetched files in place after resolving", async () => {
    const mockFetch = async () => "# content";

    const paths = await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: noConfirm,
      fetchText: mockFetch,
      log: noLog,
    });

    const readmeExists = await fs.pathExists(paths.readmePath);

    assert({
      given: "fetched extension files",
      should: "leave them in place at <folder>/.aidd/scaffold/",
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
