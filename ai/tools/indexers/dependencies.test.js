import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { createId } from "@paralleldrive/cuid2";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import {
  extractDependencies,
  indexFileDependencies,
  indexAllDependencies,
  resolveImportPath,
} from "./dependencies.js";

const setupTestDatabaseWithDirectory = async () => {
  const db = createDatabase(":memory:");
  initializeSchema(db);

  const tempDir = path.join(os.tmpdir(), `aidd-test-${createId()}`);
  await fs.ensureDir(tempDir);

  onTestFinished(async () => {
    closeDatabase(db);
    await fs.remove(tempDir);
  });

  return { db, tempDir };
};

describe("indexers/dependencies", () => {
  describe("extractDependencies", () => {
    test("extracts ES module imports", () => {
      const content = `
import foo from './foo.js';
import { bar } from '../utils/bar.js';
import * as baz from './baz.js';
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "content with ES module imports",
        should: "extract all import paths",
        actual: deps.map((d) => d.rawPath),
        expected: ["./foo.js", "../utils/bar.js", "./baz.js"],
      });
    });

    test("extracts CommonJS requires", () => {
      const content = `
const foo = require('./foo.js');
const { bar } = require('../bar.js');
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "content with require statements",
        should: "extract all require paths",
        actual: deps.map((d) => d.rawPath),
        expected: ["./foo.js", "../bar.js"],
      });
    });

    test("extracts dynamic imports", () => {
      const content = `
const mod = await import('./dynamic.js');
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "content with dynamic import",
        should: "extract dynamic import path",
        actual: deps.map((d) => d.rawPath),
        expected: ["./dynamic.js"],
      });
    });

    test("identifies import types correctly", () => {
      const content = `
import foo from './foo.js';
const bar = require('./bar.js');
const baz = await import('./baz.js');
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "mixed import types",
        should: "identify each type correctly",
        actual: deps.map((d) => d.importType),
        expected: ["import", "require", "dynamic-import"],
      });
    });

    test("extracts line numbers", () => {
      const content = `line 1
import foo from './foo.js';
line 3
const bar = require('./bar.js');
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "imports on specific lines",
        should: "extract correct line numbers",
        actual: deps.map((d) => d.lineNumber),
        expected: [2, 4],
      });
    });

    test("ignores node_modules imports", () => {
      const content = `
import lodash from 'lodash';
import local from './local.js';
import express from 'express';
`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "mix of local and npm imports",
        should: "only extract local imports",
        actual: deps.map((d) => d.rawPath),
        expected: ["./local.js"],
      });
    });

    test("extracts markdown link references", () => {
      const content = `
# Documentation

See [related doc](./related.md) for more info.
Also check [other](../docs/other.mdc).
`;
      const deps = extractDependencies(content, "docs/readme.md");

      assert({
        given: "markdown with local links",
        should: "extract link paths",
        actual: deps.map((d) => d.rawPath),
        expected: ["./related.md", "../docs/other.mdc"],
      });
    });

    test("stores original import text", () => {
      const content = `import { helper } from './utils.js';`;
      const deps = extractDependencies(content, "src/index.js");

      assert({
        given: "an import statement",
        should: "store the original text",
        actual: deps[0].importText.includes("import { helper }"),
        expected: true,
      });
    });
  });

  describe("resolveImportPath", () => {
    test("resolves relative paths", () => {
      const result = resolveImportPath("./utils.js", "src/index.js");

      assert({
        given: "relative import from src/index.js",
        should: "resolve to src/utils.js",
        actual: result,
        expected: "src/utils.js",
      });
    });

    test("resolves parent directory paths", () => {
      const result = resolveImportPath("../lib/helper.js", "src/deep/file.js");

      assert({
        given: "parent directory import",
        should: "resolve correctly",
        actual: result,
        expected: "src/lib/helper.js",
      });
    });

    test("normalizes path separators", () => {
      const result = resolveImportPath("./sub\\file.js", "src\\index.js");

      assert({
        given: "paths with backslashes",
        should: "normalize to forward slashes",
        actual: result.includes("\\"),
        expected: false,
      });
    });
  });

  describe("indexFileDependencies", () => {
    test("indexes dependencies for a JavaScript file", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Create source files
      const indexPath = path.join(tempDir, "index.js");
      const utilsPath = path.join(tempDir, "utils.js");

      await fs.writeFile(
        indexPath,
        `import { helper } from './utils.js';\nconsole.log(helper);`,
      );
      await fs.writeFile(utilsPath, `export const helper = () => {};`);

      // Index the source documents first
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("index.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("utils.js", "other", "{}", "content", "hash2");

      await indexFileDependencies(db, indexPath, tempDir);

      const deps = db.prepare("SELECT * FROM dependencies").all();

      assert({
        given: "JS file with import",
        should: "create dependency record",
        actual: deps.length,
        expected: 1,
      });
    });

    test("stores correct dependency details", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      const indexPath = path.join(tempDir, "index.js");
      const utilsPath = path.join(tempDir, "utils.js");

      await fs.writeFile(indexPath, `import { helper } from './utils.js';\n`);
      await fs.writeFile(utilsPath, `export const helper = () => {};`);

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("index.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("utils.js", "other", "{}", "content", "hash2");

      await indexFileDependencies(db, indexPath, tempDir);

      const dep = db.prepare("SELECT * FROM dependencies").get();

      assert({
        given: "indexed dependency",
        should: "have correct from_file and to_file",
        actual: { from: dep.from_file, to: dep.to_file },
        expected: { from: "index.js", to: "utils.js" },
      });
    });
  });

  describe("indexAllDependencies", () => {
    test("indexes dependencies for all JS files", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Create a simple dependency chain: a.js -> b.js -> c.js
      await fs.writeFile(path.join(tempDir, "a.js"), `import b from './b.js';`);
      await fs.writeFile(
        path.join(tempDir, "b.js"),
        `import c from './c.js'; export default c;`,
      );
      await fs.writeFile(path.join(tempDir, "c.js"), `export default 'c';`);

      // Index documents first
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("a.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("b.js", "other", "{}", "content", "hash2");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("c.js", "other", "{}", "content", "hash3");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "directory with dependency chain",
        should: "index all dependencies",
        actual: stats.indexed,
        expected: 2, // a->b and b->c
      });
    });

    test("clears existing dependencies before reindexing", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      await fs.writeFile(path.join(tempDir, "a.js"), `import b from './b.js';`);
      await fs.writeFile(path.join(tempDir, "b.js"), `export default 'b';`);

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("a.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("b.js", "other", "{}", "content", "hash2");

      // Index twice
      await indexAllDependencies(db, tempDir);
      await indexAllDependencies(db, tempDir);

      const count = db
        .prepare("SELECT COUNT(*) as count FROM dependencies")
        .get().count;

      assert({
        given: "indexing run twice",
        should: "not duplicate dependencies",
        actual: count,
        expected: 1,
      });
    });

    test("handles re-exports (export from)", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Re-export pattern: index.js re-exports from utils.js
      await fs.writeFile(
        path.join(tempDir, "index.js"),
        `export { helper } from './utils.js';`,
      );
      await fs.writeFile(
        path.join(tempDir, "utils.js"),
        `export const helper = () => {};`,
      );

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("index.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("utils.js", "other", "{}", "content", "hash2");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "file with re-export",
        should: "detect the dependency",
        actual: stats.indexed,
        expected: 1,
      });
    });

    test("handles export * from (barrel exports)", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Barrel export pattern
      await fs.writeFile(
        path.join(tempDir, "index.js"),
        `export * from './module.js';`,
      );
      await fs.writeFile(
        path.join(tempDir, "module.js"),
        `export const foo = 1; export const bar = 2;`,
      );

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("index.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("module.js", "other", "{}", "content", "hash2");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "file with barrel export",
        should: "detect the dependency",
        actual: stats.indexed,
        expected: 1,
      });
    });

    test("handles TypeScript files with imports", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // TypeScript files with standard imports
      await fs.writeFile(
        path.join(tempDir, "consumer.ts"),
        `import { helper } from './helper.ts';\nconsole.log(helper);`,
      );
      await fs.writeFile(
        path.join(tempDir, "helper.ts"),
        `export const helper = 'hi';`,
      );

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("consumer.ts", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("helper.ts", "other", "{}", "content", "hash2");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "TypeScript files with imports",
        should: "detect the dependency",
        actual: stats.indexed,
        expected: 1,
      });
    });

    test("handles side-effect imports", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Side-effect import (no bindings)
      await fs.writeFile(
        path.join(tempDir, "main.js"),
        `import './setup.js';\nconsole.log('ready');`,
      );
      await fs.writeFile(
        path.join(tempDir, "setup.js"),
        `globalThis.configured = true;`,
      );

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("main.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("setup.js", "other", "{}", "content", "hash2");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "file with side-effect import",
        should: "detect the dependency",
        actual: stats.indexed,
        expected: 1,
      });
    });

    test("handles mixed imports and re-exports in same file", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();

      // Complex file with both imports and re-exports
      await fs.writeFile(
        path.join(tempDir, "index.js"),
        `import { internal } from './internal.js';
export { external } from './external.js';
export default internal;`,
      );
      await fs.writeFile(
        path.join(tempDir, "internal.js"),
        `export const internal = 'internal';`,
      );
      await fs.writeFile(
        path.join(tempDir, "external.js"),
        `export const external = 'external';`,
      );

      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("index.js", "other", "{}", "content", "hash1");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("internal.js", "other", "{}", "content", "hash2");
      db.prepare(
        `INSERT INTO documents (path, type, frontmatter, content, hash) VALUES (?, ?, ?, ?, ?)`,
      ).run("external.js", "other", "{}", "content", "hash3");

      const stats = await indexAllDependencies(db, tempDir);

      assert({
        given: "file with both imports and re-exports",
        should: "detect both dependencies",
        actual: stats.indexed,
        expected: 2,
      });
    });
  });
});
