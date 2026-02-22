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

// mockDownload simulates a successful tarball download + extraction by writing
// the minimum files a scaffold needs into destPath.
const mockDownload = async (_url, destPath) => {
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

  test("returns downloaded:false for named scaffolds", async () => {
    const paths = await resolveExtension({
      type: "scaffold-example",
      folder: "/tmp/test-named",
      packageRoot: __dirname,
      log: noLog,
    });

    assert({
      given: "a named scaffold",
      should: "return downloaded:false",
      actual: paths.downloaded,
      expected: false,
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

  test("returns downloaded:false for file:// scaffolds", async () => {
    const uri = `file://${tempDir}`;
    const paths = await resolveExtension({
      type: uri,
      folder: "/tmp/test-file-uri",
      log: noLog,
    });

    assert({
      given: "a file:// scaffold URI",
      should: "return downloaded:false",
      actual: paths.downloaded,
      expected: false,
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

    await resolveExtension({
      type: "https://example.com/scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      download: mockDownload,
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

    await resolveExtension({
      type: "https://example.com/my-scaffold",
      folder: tempDir,
      confirm: mockConfirm,
      download: mockDownload,
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
        download: mockDownload,
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

  test("downloads tarball into <folder>/.aidd/scaffold/", async () => {
    const downloaded = [];
    const trackingDownload = async (url, destPath) => {
      downloaded.push({ destPath, url });
      await mockDownload(url, destPath);
    };

    const scaffoldDir = path.join(tempDir, ".aidd/scaffold");

    await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      folder: tempDir,
      confirm: noConfirm,
      download: trackingDownload,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "call download with the tarball URL",
      actual: downloaded[0]?.url,
      expected: "https://example.com/scaffold.tar.gz",
    });

    assert({
      given: "an HTTPS URI",
      should: "extract into <folder>/.aidd/scaffold/",
      actual: downloaded[0]?.destPath,
      expected: scaffoldDir,
    });
  });

  test("returns paths rooted at <folder>/.aidd/scaffold/", async () => {
    const paths = await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      folder: tempDir,
      confirm: noConfirm,
      download: mockDownload,
      log: noLog,
    });

    const scaffoldDir = path.join(tempDir, ".aidd/scaffold");

    assert({
      given: "an HTTPS URI with a downloaded tarball",
      should: "return readmePath rooted at .aidd/scaffold/",
      actual: paths.readmePath.startsWith(scaffoldDir),
      expected: true,
    });
  });

  test("leaves extracted scaffold in place after resolving", async () => {
    const paths = await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      folder: tempDir,
      confirm: noConfirm,
      download: mockDownload,
      log: noLog,
    });

    const readmeExists = await fs.pathExists(paths.readmePath);

    assert({
      given: "a downloaded extension",
      should: "leave extracted files in place at <folder>/.aidd/scaffold/",
      actual: readmeExists,
      expected: true,
    });
  });
});

describe("resolveExtension - tar stdin error handling", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-tar-error-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("rejects promise when download function throws (simulates pipe break)", async () => {
    const failingDownload = async () => {
      throw new Error("EPIPE: broken pipe");
    };

    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: noConfirm,
        download: failingDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "the download function throws a pipe error",
      should: "reject with ScaffoldNetworkError rather than crashing Node",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_NETWORK_ERROR",
    });
  });
});

describe("resolveExtension - readline confirm robustness", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-readline-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("rejects with ScaffoldCancelledError when confirm rejects (stdin closed)", async () => {
    const closedConfirm = async () => {
      throw Object.assign(new Error("stdin was closed"), { type: "close" });
    };

    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: closedConfirm,
        download: mockDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "confirm rejects because stdin is closed",
      should: "propagate as ScaffoldCancelledError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_CANCELLED",
    });
  });
});

describe("resolveExtension - default scaffold resolution", () => {
  const noConfig = async () => ({});

  test("uses next-shadcn when no type, no env var, and no user config", async () => {
    const originalEnv = process.env.AIDD_CUSTOM_CREATE_URI;
    delete process.env.AIDD_CUSTOM_CREATE_URI;

    const paths = await resolveExtension({
      folder: "/tmp/test-default",
      packageRoot: __dirname,
      log: noLog,
      readConfigFn: noConfig,
    });

    process.env.AIDD_CUSTOM_CREATE_URI = originalEnv;

    assert({
      given: "no type, no AIDD_CUSTOM_CREATE_URI env var, no user config",
      should: "resolve to next-shadcn named scaffold",
      actual: paths.readmePath.includes("next-shadcn"),
      expected: true,
    });
  });

  test("uses AIDD_CUSTOM_CREATE_URI env var when set and no type given", async () => {
    let tempDir;
    try {
      tempDir = path.join(os.tmpdir(), `aidd-env-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, "README.md"), "# Env Scaffold");
      await fs.writeFile(
        path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
        "steps:\n",
      );

      process.env.AIDD_CUSTOM_CREATE_URI = `file://${tempDir}`;

      const paths = await resolveExtension({
        folder: "/tmp/test-env",
        log: noLog,
        readConfigFn: noConfig,
      });

      assert({
        given: "AIDD_CUSTOM_CREATE_URI set to a file:// URI",
        should: "use the env var URI as the extension source",
        actual: paths.readmePath,
        expected: path.join(tempDir, "README.md"),
      });
    } finally {
      delete process.env.AIDD_CUSTOM_CREATE_URI;
      if (tempDir) await fs.remove(tempDir);
    }
  });

  test("uses user config create-uri when no type and no env var", async () => {
    let tempDir;
    try {
      tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, "README.md"), "# Config Scaffold");
      await fs.writeFile(
        path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
        "steps:\n",
      );

      const originalEnv = process.env.AIDD_CUSTOM_CREATE_URI;
      delete process.env.AIDD_CUSTOM_CREATE_URI;

      const paths = await resolveExtension({
        folder: "/tmp/test-config",
        log: noLog,
        readConfigFn: async () => ({ "create-uri": `file://${tempDir}` }),
      });

      process.env.AIDD_CUSTOM_CREATE_URI = originalEnv;

      assert({
        given: "~/.aidd/config.yml has create-uri and no env var or type",
        should: "use the user config URI as the extension source",
        actual: paths.readmePath,
        expected: path.join(tempDir, "README.md"),
      });
    } finally {
      if (tempDir) await fs.remove(tempDir);
    }
  });

  test("env var takes precedence over user config create-uri", async () => {
    let envDir;
    let configDir;
    try {
      envDir = path.join(os.tmpdir(), `aidd-env-prec-${Date.now()}`);
      configDir = path.join(os.tmpdir(), `aidd-cfg-prec-${Date.now()}`);
      for (const dir of [envDir, configDir]) {
        await fs.ensureDir(dir);
        await fs.writeFile(path.join(dir, "README.md"), `# Scaffold`);
        await fs.writeFile(path.join(dir, "SCAFFOLD-MANIFEST.yml"), "steps:\n");
      }

      process.env.AIDD_CUSTOM_CREATE_URI = `file://${envDir}`;

      const paths = await resolveExtension({
        folder: "/tmp/test-prec",
        log: noLog,
        readConfigFn: async () => ({ "create-uri": `file://${configDir}` }),
      });

      assert({
        given:
          "both AIDD_CUSTOM_CREATE_URI env var and user config create-uri are set",
        should: "use the env var (higher priority than user config)",
        actual: paths.readmePath,
        expected: path.join(envDir, "README.md"),
      });
    } finally {
      delete process.env.AIDD_CUSTOM_CREATE_URI;
      if (envDir) await fs.remove(envDir);
      if (configDir) await fs.remove(configDir);
    }
  });
});

describe("resolveExtension - named scaffold path traversal", () => {
  test("throws ScaffoldValidationError when type contains path traversal segments", async () => {
    let error = null;
    try {
      await resolveExtension({
        type: "../../etc/passwd",
        folder: "/tmp/test",
        packageRoot: __dirname,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a scaffold type with path traversal segments (../../etc/passwd)",
      should: "throw ScaffoldValidationError before accessing the filesystem",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });

    // The error must be about the invalid type, not about a missing manifest.
    // If it mentions "SCAFFOLD-MANIFEST.yml not found", the check fires too late.
    assert({
      given: "a scaffold type with path traversal segments",
      should: "mention the invalid type in the error, not 'not found'",
      actual:
        typeof error?.message === "string" &&
        !error.message.includes("not found"),
      expected: true,
    });
  });

  test('throws ScaffoldValidationError for type "."', async () => {
    let error = null;
    try {
      await resolveExtension({
        type: ".",
        folder: "/tmp/test",
        packageRoot: __dirname,
        log: noLog,
        readConfigFn: async () => ({}),
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: 'type = "."',
      should: "throw ScaffoldValidationError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });

    assert({
      given: 'type = "."',
      should:
        "not describe the error as 'outside the scaffolds directory' (it resolves to the root, not outside)",
      actual:
        typeof error?.message === "string" &&
        !error.message.includes("outside"),
      expected: true,
    });
  });

  test("valid named type resolves without error", async () => {
    let error = null;
    try {
      await resolveExtension({
        type: "scaffold-example",
        folder: "/tmp/test",
        packageRoot: __dirname,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a valid named scaffold type",
      should: "not throw a path traversal error",
      actual: error?.cause?.code,
      expected: undefined,
    });
  });
});

describe("resolveExtension - GitHub repo URL auto-resolution", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-gh-resolve-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  const mockResolveRelease = async () =>
    "https://api.github.com/repos/org/repo/tarball/v1.0.0";

  test("calls resolveRelease for bare https://github.com/owner/repo URLs", async () => {
    const resolved = [];
    const trackingResolve = async (url) => {
      resolved.push(url);
      return "https://api.github.com/repos/org/repo/tarball/v1.0.0";
    };

    await resolveExtension({
      type: "https://github.com/org/repo",
      folder: tempDir,
      confirm: noConfirm,
      download: mockDownload,
      resolveRelease: trackingResolve,
      log: noLog,
    });

    assert({
      given: "a bare https://github.com/owner/repo URL",
      should: "call resolveRelease with the repo URL",
      actual: resolved[0],
      expected: "https://github.com/org/repo",
    });
  });

  test("downloads the resolved tarball URL, not the bare repo URL", async () => {
    const downloaded = [];
    const trackingDownload = async (url, dest) => {
      downloaded.push(url);
      await mockDownload(url, dest);
    };

    await resolveExtension({
      type: "https://github.com/org/repo",
      folder: tempDir,
      confirm: noConfirm,
      download: trackingDownload,
      resolveRelease: mockResolveRelease,
      log: noLog,
    });

    assert({
      given: "a bare GitHub repo URL with a resolved tarball",
      should: "download the tarball URL returned by resolveRelease",
      actual: downloaded[0],
      expected: "https://api.github.com/repos/org/repo/tarball/v1.0.0",
    });
  });

  test("does not call resolveRelease for direct tarball URLs", async () => {
    const resolved = [];
    const trackingResolve = async (url) => {
      resolved.push(url);
      return url;
    };

    await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      folder: tempDir,
      confirm: noConfirm,
      download: mockDownload,
      resolveRelease: trackingResolve,
      log: noLog,
    });

    assert({
      given: "a direct tarball URL (not a bare GitHub repo URL)",
      should: "not call resolveRelease",
      actual: resolved.length,
      expected: 0,
    });
  });

  test("throws ScaffoldNetworkError when resolveRelease throws", async () => {
    const failingResolve = async () => {
      throw new Error("No releases found");
    };

    let error = null;
    try {
      await resolveExtension({
        type: "https://github.com/org/repo",
        folder: tempDir,
        confirm: noConfirm,
        download: mockDownload,
        resolveRelease: failingResolve,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a GitHub repo URL with no releases",
      should: "throw ScaffoldNetworkError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_NETWORK_ERROR",
    });
  });
});

describe("resolveExtension - HTTPS enforcement", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-https-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("throws ScaffoldValidationError for plain http:// URIs", async () => {
    let error = null;
    try {
      await resolveExtension({
        type: "http://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: noConfirm,
        download: mockDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a plain http:// scaffold URI",
      should: "throw ScaffoldValidationError before any network request",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("includes the URI and https:// instruction in the error message for http://", async () => {
    let error = null;
    try {
      await resolveExtension({
        type: "http://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: noConfirm,
        download: mockDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a plain http:// scaffold URI",
      should: "name the rejected URI and instruct to use https://",
      actual:
        error?.message.includes("http://example.com/scaffold.tar.gz") &&
        error?.message.includes("https://"),
      expected: true,
    });
  });

  test("does not throw for https:// URIs", async () => {
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: noConfirm,
        download: mockDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "an https:// scaffold URI",
      should: "not throw a validation error",
      actual: error?.cause?.code,
      expected: undefined,
    });
  });

  test("returns downloaded:true for https:// scaffolds", async () => {
    const paths = await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      folder: tempDir,
      confirm: noConfirm,
      download: mockDownload,
      log: noLog,
    });

    assert({
      given: "an https:// scaffold URI",
      should: "return downloaded:true",
      actual: paths.downloaded,
      expected: true,
    });
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

  test("throws ScaffoldValidationError when downloaded HTTP scaffold has no SCAFFOLD-MANIFEST.yml", async () => {
    // mockDownload that extracts NO manifest file
    const downloadWithoutManifest = async (_url, destPath) => {
      await fs.ensureDir(destPath);
      await fs.writeFile(path.join(destPath, "README.md"), "# No Manifest");
    };

    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        folder: tempDir,
        confirm: noConfirm,
        download: downloadWithoutManifest,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "an HTTP scaffold download that contains no SCAFFOLD-MANIFEST.yml",
      should: "throw ScaffoldValidationError mentioning the URI",
      actual:
        error?.cause?.code === "SCAFFOLD_VALIDATION_ERROR" &&
        typeof error?.message === "string" &&
        error.message.includes("https://example.com/scaffold"),
      expected: true,
    });
  });
});
