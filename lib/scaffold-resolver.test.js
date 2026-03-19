import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  return { ...actual, spawn: vi.fn() };
});

import { spawn } from "child_process";

import {
  defaultDownloadAndExtract,
  defaultResolveRelease,
  resolveExtension,
} from "./scaffold-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const noLog = () => {};
const noConfirm = async () => true;

// mockDownload simulates a successful tarball download + extraction by writing
// the minimum files a scaffold needs into destPath.
const mockDownload = async (
  /** @type {any} */ _url,
  /** @type {string} */ destPath,
) => {
  await fs.ensureDir(path.join(destPath, "bin"));
  await fs.writeFile(path.join(destPath, "README.md"), "# Remote Scaffold");
  await fs.writeFile(
    path.join(destPath, "SCAFFOLD-MANIFEST.yml"),
    "steps:\n  - run: echo hello\n",
  );
};

describe("resolveExtension - named scaffold", () => {
  test("resolves manifest and readme paths for a named scaffold", async () => {
    const paths = await resolveExtension({
      type: "scaffold-example",
      packageRoot: __dirname,
      log: noLog,
    });

    assert({
      given: "a named scaffold type",
      should: "resolve both manifest and readme paths correctly",
      actual: {
        manifestPath: paths.manifestPath.endsWith(
          path.join(
            "ai",
            "scaffolds",
            "scaffold-example",
            "SCAFFOLD-MANIFEST.yml",
          ),
        ),
        readmePath: paths.readmePath.endsWith(
          path.join("ai", "scaffolds", "scaffold-example", "README.md"),
        ),
      },
      expected: { manifestPath: true, readmePath: true },
    });
  });

  test("displays README contents when README exists", async () => {
    const logged = /** @type {string[]} */ ([]);
    await resolveExtension({
      type: "scaffold-example",
      packageRoot: __dirname,
      log: (/** @type {string} */ msg) => logged.push(msg),
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
  /** @type {string} */
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

  test("resolves manifest and readme paths from a file:// URI", async () => {
    const uri = `file://${tempDir}`;
    const paths = await resolveExtension({
      type: uri,
      log: noLog,
    });

    assert({
      given: "a file:// URI",
      should: "resolve both manifest and readme paths to the local directory",
      actual: {
        readmePath: paths.readmePath,
        manifestPath: paths.manifestPath,
      },
      expected: {
        readmePath: path.join(tempDir, "README.md"),
        manifestPath: path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
      },
    });
  });

  test("displays README contents from file:// URI", async () => {
    const uri = `file://${tempDir}`;
    const logged = /** @type {string[]} */ ([]);
    await resolveExtension({
      type: uri,
      log: (/** @type {string} */ msg) => logged.push(msg),
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
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-http-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("warns user about remote code before downloading", async () => {
    const warnings = /** @type {string[]} */ ([]);
    const mockConfirm = async (/** @type {string} */ msg) => {
      warnings.push(msg);
      return true;
    };

    await resolveExtension({
      type: "https://example.com/scaffold",
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
    const warnings = /** @type {string[]} */ ([]);
    const mockConfirm = async (/** @type {string} */ msg) => {
      warnings.push(msg);
      return true;
    };

    await resolveExtension({
      type: "https://example.com/my-scaffold",
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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

    let errorThrown = /** @type {any} */ (null);
    try {
      await resolveExtension({
        type: "https://example.com/scaffold",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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

  test("downloads tarball into ~/.aidd/scaffold/", async () => {
    const downloaded = /** @type {any[]} */ ([]);
    const trackingDownload = async (
      /** @type {string} */ url,
      /** @type {string} */ destPath,
    ) => {
      downloaded.push({ destPath, url });
      await mockDownload(url, destPath);
    };

    const scaffoldDir = path.join(tempDir, "scaffold");

    await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      scaffoldDownloadDir: scaffoldDir,
      confirm: noConfirm,
      download: trackingDownload,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI",
      should: "call download with the correct URL and destination",
      actual: { url: downloaded[0]?.url, destPath: downloaded[0]?.destPath },
      expected: {
        url: "https://example.com/scaffold.tar.gz",
        destPath: scaffoldDir,
      },
    });
  });

  test("returns paths rooted at ~/.aidd/scaffold/", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");

    const paths = await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      scaffoldDownloadDir: scaffoldDir,
      confirm: noConfirm,
      download: mockDownload,
      log: noLog,
    });

    assert({
      given: "an HTTPS URI with a downloaded tarball",
      should: "return readmePath rooted at ~/.aidd/scaffold/",
      actual: paths.readmePath,
      expected: path.join(scaffoldDir, "README.md"),
    });
  });

  test("leaves extracted scaffold in place after resolving", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");

    const paths = await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      scaffoldDownloadDir: scaffoldDir,
      confirm: noConfirm,
      download: mockDownload,
      log: noLog,
    });

    const readmeExists = await fs.pathExists(paths.readmePath);

    assert({
      given: "a downloaded extension",
      should: "leave extracted files in place at ~/.aidd/scaffold/",
      actual: readmeExists,
      expected: true,
    });
  });
});

describe("resolveExtension - tar stdin error handling", () => {
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-tar-error-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.mocked(spawn).mockReset();
  });

  test("resolves when stdin emits EPIPE error before child closes with code 0", async () => {
    const stdinHandlers = /** @type {Record<string, Function>} */ ({});
    const childHandlers = /** @type {Record<string, Function>} */ ({});

    const fakeChild = /** @type {any} */ ({
      stdin: {
        on(/** @type {string} */ event, /** @type {Function} */ handler) {
          stdinHandlers[event] = handler;
        },
        write() {},
        end() {
          // EPIPE fires first (before close), simulating tar exiting before
          // consuming all stdin. The settled guard should let close(0) win.
          setImmediate(() => {
            stdinHandlers.error?.(
              Object.assign(new Error("write EPIPE"), { code: "EPIPE" }),
            );
            setImmediate(() => childHandlers.close?.(0));
          });
        },
      },
      on(/** @type {string} */ event, /** @type {Function} */ handler) {
        childHandlers[event] = handler;
        return this;
      },
    });

    vi.mocked(spawn).mockReturnValueOnce(fakeChild);

    const savedFetch = globalThis.fetch;
    globalThis.fetch = /** @type {any} */ (
      async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
    );

    /** @type {any} */
    let error = null;
    try {
      await defaultDownloadAndExtract(
        "https://example.com/test.tar.gz",
        path.join(tempDir, "extract"),
      );
    } catch (err) {
      error = err;
    } finally {
      globalThis.fetch = savedFetch;
    }

    assert({
      given:
        "child.stdin emits EPIPE error before child.close fires with code 0",
      should:
        "resolve (settled guard prevents EPIPE from rejecting a successful tar run)",
      actual: error,
      expected: null,
    });
  });

  test("rejects promise when download function throws (simulates pipe break)", async () => {
    const failingDownload = async () => {
      throw new Error("EPIPE: broken pipe");
    };

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-readline-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("preserves the original error message when confirm throws with a specific message", async () => {
    const specificMessage =
      "Remote extension download cancelled (stdin closed).";
    const stdinClosedConfirm = async () => {
      const err = new Error(specificMessage);
      throw err;
    };

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
        confirm: stdinClosedConfirm,
        download: mockDownload,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "confirm throws with a specific message",
      should: "preserve the original message on the thrown error",
      actual: /** @type {any} */ (error)?.message,
      expected: specificMessage,
    });
  });

  test("rejects with ScaffoldCancelledError when confirm rejects (stdin closed)", async () => {
    const closedConfirm = async () => {
      throw Object.assign(new Error("stdin was closed"), { type: "close" });
    };

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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

    let paths;
    try {
      paths = await resolveExtension({
        packageRoot: __dirname,
        log: noLog,
        readConfigFn: noConfig,
      });
    } finally {
      if (originalEnv === undefined) {
        delete process.env.AIDD_CUSTOM_CREATE_URI;
      } else {
        process.env.AIDD_CUSTOM_CREATE_URI = originalEnv;
      }
    }

    assert({
      given: "no type, no AIDD_CUSTOM_CREATE_URI env var, no user config",
      should: "resolve to next-shadcn named scaffold",
      actual: paths.readmePath.includes("next-shadcn"),
      expected: true,
    });
  });

  test("uses AIDD_CUSTOM_CREATE_URI env var when set and no type given", async () => {
    let tempDir = /** @type {string} */ ("");
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
    let tempDir = /** @type {string} */ ("");
    const originalEnv = process.env.AIDD_CUSTOM_CREATE_URI;
    delete process.env.AIDD_CUSTOM_CREATE_URI;

    try {
      tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, "README.md"), "# Config Scaffold");
      await fs.writeFile(
        path.join(tempDir, "SCAFFOLD-MANIFEST.yml"),
        "steps:\n",
      );

      const paths = await resolveExtension({
        log: noLog,
        readConfigFn: async () => ({ "create-uri": `file://${tempDir}` }),
      });

      assert({
        given: "~/.aidd/config.yml has create-uri and no env var or type",
        should: "use the user config URI as the extension source",
        actual: paths.readmePath,
        expected: path.join(tempDir, "README.md"),
      });
    } finally {
      if (originalEnv === undefined) {
        delete process.env.AIDD_CUSTOM_CREATE_URI;
      } else {
        process.env.AIDD_CUSTOM_CREATE_URI = originalEnv;
      }
      if (tempDir) await fs.remove(tempDir);
    }
  });

  test("AIDD_CUSTOM_CREATE_URI is absent after tests that ran without it set", () => {
    assert({
      given: "AIDD_CUSTOM_CREATE_URI was not set before the describe block ran",
      should:
        "be absent from process.env after test cleanup (not coerced to the string 'undefined')",
      actual: process.env.AIDD_CUSTOM_CREATE_URI,
      expected: undefined,
    });
  });

  test("env var takes precedence over user config create-uri", async () => {
    let envDir = /** @type {string} */ ("");
    let configDir = /** @type {string} */ ("");
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
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "../../etc/passwd",
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
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: ".",
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
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "scaffold-example",
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
  /** @type {string} */
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
    const resolved = /** @type {string[]} */ ([]);
    const trackingResolve = async (/** @type {string} */ url) => {
      resolved.push(url);
      return "https://api.github.com/repos/org/repo/tarball/v1.0.0";
    };

    await resolveExtension({
      type: "https://github.com/org/repo",
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
    const downloaded = /** @type {string[]} */ ([]);
    const trackingDownload = async (
      /** @type {string} */ url,
      /** @type {string} */ dest,
    ) => {
      downloaded.push(url);
      await mockDownload(url, dest);
    };

    await resolveExtension({
      type: "https://github.com/org/repo",
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
    const resolved = /** @type {string[]} */ ([]);
    const trackingResolve = async (/** @type {string} */ url) => {
      resolved.push(url);
      return url;
    };

    await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://github.com/org/repo",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-https-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("throws ScaffoldValidationError for plain http:// URIs", async () => {
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "http://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "http://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
      scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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
  /** @type {string} */
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

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({ type: uri, log: noLog });
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

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({ type: uri, log: noLog });
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
    // @ts-expect-error
    const downloadWithoutManifest = async (_url, destPath) => {
      await fs.ensureDir(destPath);
      await fs.writeFile(path.join(destPath, "README.md"), "# No Manifest");
    };

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: path.join(tempDir, "scaffold"),
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

describe("defaultResolveRelease - GITHUB_TOKEN auth and error messages", () => {
  /** @type {any} */
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
    vi.restoreAllMocks();
  });

  test("includes Authorization header when GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "test-token-123";
    /** @type {Record<string, string>} */
    const capturedHeaders = {};
    // @ts-expect-error
    globalThis.fetch = async (_url, opts = {}) => {
      Object.assign(capturedHeaders, opts.headers || {});
      return {
        ok: true,
        json: async () => ({
          tarball_url: "https://api.github.com/repos/org/repo/tarball/v1.0.0",
        }),
      };
    };

    await defaultResolveRelease("https://github.com/org/repo");

    assert({
      given: "GITHUB_TOKEN is set in the environment",
      should: "include Authorization: Bearer header in the GitHub API request",
      actual: capturedHeaders.Authorization,
      expected: "Bearer test-token-123",
    });
  });

  test("does not include Authorization header when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    /** @type {Record<string, string>} */
    const capturedHeaders = {};
    // @ts-expect-error
    globalThis.fetch = async (_url, opts = {}) => {
      Object.assign(capturedHeaders, opts.headers || {});
      return {
        ok: true,
        json: async () => ({
          tarball_url: "https://api.github.com/repos/org/repo/tarball/v1.0.0",
        }),
      };
    };

    await defaultResolveRelease("https://github.com/org/repo");

    assert({
      given: "GITHUB_TOKEN is not set",
      should: "not include Authorization header",
      actual: "Authorization" in capturedHeaders,
      expected: false,
    });
  });

  test("error for 403 mentions rate limit and GITHUB_TOKEN", async () => {
    // @ts-expect-error
    globalThis.fetch = async () => ({ ok: false, status: 403 });

    /** @type {any} */
    let error = null;
    try {
      await defaultResolveRelease("https://github.com/org/repo");
    } catch (err) {
      error = err;
    }

    assert({
      given: "GitHub API returns 403",
      should: "mention rate limit in the error",
      actual:
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("rate limit"),
      expected: true,
    });

    assert({
      given: "GitHub API returns 403",
      should: "mention GITHUB_TOKEN in the error",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("GITHUB_TOKEN"),
      expected: true,
    });
  });

  test("error for 404 without GITHUB_TOKEN hints to set the token", async () => {
    delete process.env.GITHUB_TOKEN;
    // @ts-expect-error
    globalThis.fetch = async () => ({ ok: false, status: 404 });

    /** @type {any} */
    let error = null;
    try {
      await defaultResolveRelease("https://github.com/org/repo");
    } catch (err) {
      error = err;
    }

    assert({
      given: "GitHub API returns 404 and GITHUB_TOKEN is not set",
      should: "include GITHUB_TOKEN hint in the error",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("GITHUB_TOKEN"),
      expected: true,
    });
  });

  test("error for 404 with GITHUB_TOKEN set does not include token hint", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    // @ts-expect-error
    globalThis.fetch = async () => ({ ok: false, status: 404 });

    /** @type {any} */
    let error = null;
    try {
      await defaultResolveRelease("https://github.com/org/repo");
    } catch (err) {
      error = err;
    }

    assert({
      given: "GitHub API returns 404 and GITHUB_TOKEN is set",
      should:
        "not include set-GITHUB_TOKEN hint (token is already set; repo simply does not exist or has no releases)",
      actual:
        typeof error?.message === "string" &&
        !error.message.includes("set GITHUB_TOKEN"),
      expected: true,
    });
  });

  test("strips .git suffix from repo URL when constructing the API URL", async () => {
    /** @type {string} */
    let capturedUrl = "";
    // @ts-expect-error
    globalThis.fetch = async (/** @type {string} */ url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          tarball_url: "https://api.github.com/repos/org/repo/tarball/v1.0.0",
        }),
      };
    };

    await defaultResolveRelease("https://github.com/org/repo.git");

    assert({
      given: "a GitHub repo URL ending with .git",
      should: "construct the API URL without the .git suffix",
      actual: capturedUrl,
      expected: "https://api.github.com/repos/org/repo/releases/latest",
    });
  });
});

describe("resolveExtension — download dir guard", () => {
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-download-ext-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("throws ScaffoldDestinationError when scaffoldDownloadDir already exists", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");
    const existsFn = async () => true;

    /** @type {any} */
    let error = null;
    try {
      await resolveExtension({
        type: "https://example.com/scaffold.tar.gz",
        scaffoldDownloadDir: scaffoldDir,
        confirm: noConfirm,
        download: mockDownload,
        existsFn,
        log: noLog,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "scaffoldDownloadDir already exists",
      should:
        "throw ScaffoldDestinationError naming the path and instructing manual deletion",
      actual: {
        code: error?.cause?.code,
        mentionsPath: error?.message?.includes(scaffoldDir),
        mentionsDelete: error?.message?.toLowerCase().includes("delete"),
      },
      expected: {
        code: "SCAFFOLD_DESTINATION_ERROR",
        mentionsPath: true,
        mentionsDelete: true,
      },
    });
  });

  test("calls download normally when scaffoldDownloadDir does not exist", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");
    const existsFn = async () => false;
    const downloaded = /** @type {string[]} */ ([]);
    const trackingDownload = async (
      /** @type {string} */ url,
      /** @type {string} */ dest,
    ) => {
      downloaded.push(url);
      await mockDownload(url, dest);
    };

    await resolveExtension({
      type: "https://example.com/scaffold.tar.gz",
      scaffoldDownloadDir: scaffoldDir,
      confirm: noConfirm,
      download: trackingDownload,
      existsFn,
      log: noLog,
    });

    assert({
      given: "scaffoldDownloadDir does not exist",
      should: "call download with the URI and destination",
      actual: downloaded[0],
      expected: "https://example.com/scaffold.tar.gz",
    });
  });
});

describe("defaultDownloadAndExtract - GITHUB_TOKEN auth", () => {
  /** @type {any} */
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
  });

  test("includes Authorization header for api.github.com URLs when GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "test-token-123";
    /** @type {Record<string, string>} */
    const capturedHeaders = {};
    // Empty buffer — tar will fail, but we only care that fetch was called with auth
    // @ts-expect-error
    globalThis.fetch = async (_url, opts = {}) => {
      Object.assign(capturedHeaders, opts.headers || {});
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
    };

    try {
      await defaultDownloadAndExtract(
        "https://api.github.com/repos/org/repo/tarball/v1.0.0",
        "/tmp/aidd-test-auth-dest",
      );
    } catch {
      // tar failure on empty buffer is expected — headers are what we're testing
    }

    assert({
      given: "GITHUB_TOKEN is set and URL hostname is api.github.com",
      should: "include Authorization: Bearer header in the download request",
      actual: capturedHeaders.Authorization,
      expected: "Bearer test-token-123",
    });
  });

  test("does not include Authorization header for third-party URLs when GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "test-token-123";
    /** @type {Record<string, string>} */
    const capturedHeaders = {};
    // @ts-expect-error
    globalThis.fetch = async (_url, opts = {}) => {
      Object.assign(capturedHeaders, opts.headers || {});
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
    };

    try {
      await defaultDownloadAndExtract(
        "https://example.com/scaffold.tar.gz",
        "/tmp/aidd-test-auth-dest",
      );
    } catch {
      // tar failure expected — headers are what we're testing
    }

    assert({
      given: "GITHUB_TOKEN is set and URL is a third-party host",
      should:
        "not include Authorization header (token must not leak to other servers)",
      actual: capturedHeaders.Authorization,
      expected: undefined,
    });
  });
});
