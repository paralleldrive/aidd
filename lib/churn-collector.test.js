// @ts-check

import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { collectChurn, parseChurnOutput } from "./churn-collector.js";

// --- pure unit tests ---

describe("parseChurnOutput", () => {
  test("touch counts", () => {
    const output = "src/foo.js\nsrc/foo.js\nsrc/bar.js\n";

    assert({
      given: "git log output with repeated file entries",
      should: "return correct touch count per file",
      actual: {
        foo: parseChurnOutput(output).get("src/foo.js"),
        bar: parseChurnOutput(output).get("src/bar.js"),
      },
      expected: { foo: 2, bar: 1 },
    });
  });

  test("blank lines ignored", () => {
    const output = "\nsrc/foo.js\n\n\nsrc/bar.js\n\n";

    assert({
      given: "output with blank lines between file entries",
      should: "ignore blank lines and count only real paths",
      actual: parseChurnOutput(output).size,
      expected: 2,
    });
  });

  test("empty output", () => {
    assert({
      given: "empty git log output",
      should: "return an empty map",
      actual: parseChurnOutput("").size,
      expected: 0,
    });
  });
});

// --- e2e tests against real git/filesystem ---

describe("collectChurn", { timeout: 30_000 }, () => {
  test("returns touched files from real git repo", () => {
    const result = collectChurn({ cwd: process.cwd(), days: 90 });

    assert({
      given: "the current git repository",
      should: "include package.json with at least one touch",
      actual: (result.get("package.json") ?? 0) > 0,
      expected: true,
    });
  });

  test("not a git repo throws NotAGitRepo error", () => {
    const dir = os.tmpdir();
    let error;

    try {
      collectChurn({ cwd: dir, days: 90 });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a directory that is not a git repository",
      should: "throw a NotAGitRepo caused error",
      actual: /** @type {any} */ (error)?.cause?.name,
      expected: "NotAGitRepo",
    });
  });

  test("main-history file outside the day window is absent", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "churn-days-zero-"));

    try {
      // Use backdated timestamps so the single commit falls outside
      // the days: 0 window, and no PR diff exists (HEAD == origin/main).
      const runOld = (/** @type {string} */ cmd) =>
        execSync(cmd, {
          cwd: tmpDir,
          stdio: "pipe",
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: "2000-01-01T00:00:00",
            GIT_COMMITTER_DATE: "2000-01-01T00:00:00",
          },
        });
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 1;\n");
      run("git add file-a.js");
      runOld('git commit -m "old: add file-a"');

      // origin/main == HEAD so the PR diff is empty
      const mainSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();
      run(`git update-ref refs/remotes/origin/main ${mainSha}`);

      const result = collectChurn({ cwd: tmpDir, days: 0 });

      assert({
        given: "a zero-day window with no PR diff",
        should: "return an empty map since main files are outside the window",
        actual: result.size,
        expected: 0,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("PR-only file gets +1 for the upcoming squash commit", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "churn-pr-plus-one-"));

    try {
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      // Commit that represents existing main history
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 1;\n");
      run("git add file-a.js");
      run('git commit -m "main: add file-a"');

      // Point origin/main at this commit
      const mainSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();
      run(`git update-ref refs/remotes/origin/main ${mainSha}`);

      // PR-only commit — file-b is not on main
      fs.writeFileSync(path.join(tmpDir, "file-b.js"), "const b = 2;\n");
      run("git add file-b.js");
      run('git commit -m "PR: add file-b"');

      const result = collectChurn({ cwd: tmpDir, days: 90 });

      assert({
        given: "a file only added in the PR branch",
        should: "have count 1 for the upcoming squash commit",
        actual: result.get("file-b.js"),
        expected: 1,
      });

      assert({
        given: "a file modified only in main history (not in PR diff)",
        should: "appear in the churn map with its main history count only",
        actual: result.get("file-a.js"),
        expected: 1,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("main-only file does not get +1 when absent from the PR diff", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "churn-no-pr-bonus-"));

    try {
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      // Two files on main
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 1;\n");
      fs.writeFileSync(path.join(tmpDir, "file-c.js"), "const c = 3;\n");
      run("git add file-a.js file-c.js");
      run('git commit -m "main: add file-a and file-c"');

      const mainSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();
      run(`git update-ref refs/remotes/origin/main ${mainSha}`);

      // PR only touches file-a.js — file-c.js is untouched
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 2;\n");
      run("git add file-a.js");
      run('git commit -m "PR: update file-a only"');

      const result = collectChurn({ cwd: tmpDir, days: 90 });

      assert({
        given: "a main file not present in the PR diff",
        should: "not receive the +1 squash bonus",
        actual: result.get("file-c.js"),
        expected: 1,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("origin/master default branch: file touched twice in PR counts as 1", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "churn-master-default-"),
    );

    try {
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      // One commit on master history
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 1;\n");
      run("git add file-a.js");
      run('git commit -m "master: add file-a"');

      const masterSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();

      // Set up origin/master — NOT origin/main
      run(`git update-ref refs/remotes/origin/master ${masterSha}`);
      // Point origin/HEAD at origin/master so git symbolic-ref can discover it
      run(
        "git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/master",
      );

      // Two PR commits touching file-b (no origin/main exists)
      fs.writeFileSync(path.join(tmpDir, "file-b.js"), "const b = 1;\n");
      run("git add file-b.js");
      run('git commit -m "PR: add file-b"');

      fs.writeFileSync(path.join(tmpDir, "file-b.js"), "const b = 2;\n");
      run("git add file-b.js");
      run('git commit -m "PR: update file-b"');

      const result = collectChurn({ cwd: tmpDir, days: 90 });

      assert({
        given:
          "a repo with origin/master as default and file-b touched twice in the PR",
        should:
          "count file-b as 1 (one upcoming squash commit), not 2 (raw PR commits)",
        actual: result.get("file-b.js"),
        expected: 1,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("file deleted in PR does not get +1 when outside main history window", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "churn-pr-delete-no-bonus-"),
    );

    try {
      const runOld = (/** @type {string} */ cmd) =>
        execSync(cmd, {
          cwd: tmpDir,
          stdio: "pipe",
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: "2000-01-01T00:00:00",
            GIT_COMMITTER_DATE: "2000-01-01T00:00:00",
          },
        });
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      fs.writeFileSync(path.join(tmpDir, "file-removed.js"), "gone later;\n");
      run("git add file-removed.js");
      runOld('git commit -m "main: add file-removed (old)"');

      const mainSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();
      run(`git update-ref refs/remotes/origin/main ${mainSha}`);

      fs.rmSync(path.join(tmpDir, "file-removed.js"));
      run("git add file-removed.js");
      run('git commit -m "PR: delete file-removed"');

      const result = collectChurn({ cwd: tmpDir, days: 0 });

      assert({
        given:
          "a file that exists only on main outside the day window and is deleted in the PR",
        should:
          "not appear in the churn map with a spurious +1 from the PR diff (deleted paths excluded)",
        actual: result.get("file-removed.js") ?? 0,
        expected: 0,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("file in both main history and PR diff gets main count plus one", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "churn-both-"));

    try {
      const run = (/** @type {string} */ cmd) =>
        execSync(cmd, { cwd: tmpDir, stdio: "pipe" });

      run("git init");
      run('git config user.email "test@example.com"');
      run('git config user.name "Test"');

      // file-a.js touched once on main
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 1;\n");
      run("git add file-a.js");
      run('git commit -m "main: add file-a"');

      const mainSha = execSync("git rev-parse HEAD", {
        cwd: tmpDir,
        encoding: "utf8",
      }).trim();
      run(`git update-ref refs/remotes/origin/main ${mainSha}`);

      // PR also modifies file-a.js
      fs.writeFileSync(path.join(tmpDir, "file-a.js"), "const a = 2;\n");
      run("git add file-a.js");
      run('git commit -m "PR: update file-a"');

      const result = collectChurn({ cwd: tmpDir, days: 90 });

      assert({
        given: "a file touched once on main and also in the PR diff",
        should: "have count 2 (main count + 1 for the squash commit)",
        actual: result.get("file-a.js"),
        expected: 2,
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
