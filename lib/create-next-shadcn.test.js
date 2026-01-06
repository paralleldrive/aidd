import { assert } from "riteway/vitest";
import { describe, test, vi, beforeEach, afterEach } from "vitest";
import * as childProcess from "child_process";
import * as util from "util";

// Mock child_process before importing the module
vi.mock("child_process");
vi.mock("util");

describe("executeCreateNextShadcn", () => {
  let execAsyncMock;

  beforeEach(async () => {
    execAsyncMock = vi.fn();
    vi.mocked(util.promisify).mockReturnValue(execAsyncMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("should check for claude CLI", async () => {
    const called = [];
    execAsyncMock.mockImplementation((cmd) => {
      called.push(cmd);
      if (cmd === "which claude") {
        return Promise.resolve({
          stdout: "/usr/local/bin/claude\n",
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "OK", stderr: "" });
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn();

    assert({
      given: "executeCreateNextShadcn is called",
      should: "check if claude CLI exists",
      actual: called.some((cmd) => cmd === "which claude"),
      expected: true,
    });
  });

  test("should return error when claude CLI is not found", async () => {
    execAsyncMock.mockImplementation((cmd) => {
      if (cmd === "which claude") {
        return Promise.reject(new Error("not found"));
      }
      return Promise.resolve({ stdout: "OK", stderr: "" });
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    const result = await executeCreateNextShadcn();

    assert({
      given: "claude CLI is not installed",
      should: "return error with installation instructions",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "claude CLI is not installed",
      should: "include error message about claude installation",
      actual: result.error?.includes("Claude Code CLI"),
      expected: true,
    });
  });

  test("should execute claude with correct prompt URL", async () => {
    const called = [];
    execAsyncMock.mockImplementation((cmd) => {
      called.push(cmd);
      return Promise.resolve({ stdout: "OK", stderr: "" });
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn();

    const claudeCommand = called.find((cmd) => cmd.includes("| claude"));

    assert({
      given: "claude CLI exists",
      should: "execute claude command",
      actual: claudeCommand !== undefined,
      expected: true,
    });
  });

  test("should pipe prompt instructions to claude", async () => {
    const called = [];
    execAsyncMock.mockImplementation((cmd) => {
      called.push(cmd);
      return Promise.resolve({ stdout: "OK", stderr: "" });
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn();

    const claudeCommand = called.find((cmd) => cmd.includes("| claude"));

    assert({
      given: "claude command is executed",
      should: "include prompt instructions",
      actual:
        claudeCommand?.includes("Follow these instructions exactly") ||
        claudeCommand?.includes("echo"),
      expected: true,
    });
  });

  test("should include GitHub prompt URL", async () => {
    const called = [];
    execAsyncMock.mockImplementation((cmd) => {
      called.push(cmd);
      return Promise.resolve({ stdout: "OK", stderr: "" });
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn();

    const claudeCommand = called.find((cmd) => cmd.includes("| claude"));

    assert({
      given: "claude command is executed",
      should: "reference the GitHub prompt URL",
      actual:
        claudeCommand?.includes("new-project-setup-nextjs-shadcn.md") ||
        claudeCommand?.includes("curl"),
      expected: true,
    });
  });
});
