import { EventEmitter } from "events";
import { assert } from "riteway/vitest";
import { beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process", async () => {
  const actual = /** @type {typeof import("child_process")} */ (
    await vi.importActual("child_process")
  );
  return { ...actual, spawn: vi.fn(actual.spawn) };
});

import { spawn } from "child_process";

import { runAgent } from "./runner.js";

const makeProcess = ({ exitCode = 0 } = {}) => {
  const proc = new EventEmitter();
  process.nextTick(() => proc.emit("close", exitCode));
  return /** @type {any} */ (proc);
};

describe("runAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("spawns [command, ...args, prompt] as no-shell array with stdio inherit", async () => {
    vi.mocked(spawn).mockImplementationOnce(() => makeProcess());

    await runAgent({
      agentConfig: { command: "claude", args: ["-p"] },
      prompt: "do this",
      cwd: "/tmp",
    });

    assert({
      given: "agentConfig with command and args plus a prompt",
      should:
        "spawn [command, ...args, prompt] with shell: false and stdio: inherit",
      actual: vi.mocked(spawn).mock.calls[0],
      expected: [
        "claude",
        ["-p", "do this"],
        { cwd: "/tmp", shell: false, stdio: "inherit" },
      ],
    });
  });

  test("spreads empty args when agentConfig has no args property", async () => {
    vi.mocked(spawn).mockImplementationOnce(() => makeProcess());

    await runAgent({
      agentConfig: { command: "myagent" },
      prompt: "hello world",
      cwd: "/workspace",
    });

    assert({
      given: "agentConfig with no args",
      should: "spawn [command, prompt] with no extra args",
      actual: vi.mocked(spawn).mock.calls[0],
      expected: [
        "myagent",
        ["hello world"],
        { cwd: "/workspace", shell: false, stdio: "inherit" },
      ],
    });
  });

  test("rejects with signal name in message when spawned process is killed by a signal", async () => {
    const proc = new EventEmitter();
    process.nextTick(() => proc.emit("close", null, "SIGTERM"));
    vi.mocked(spawn).mockImplementationOnce(() => /** @type {any} */ (proc));

    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "claude", args: ["-p"] },
        prompt: "do something",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawned process is killed by SIGTERM",
      should: "reject with an error message that includes the signal name",
      actual: /** @type {any} */ (error)?.message?.includes("SIGTERM"),
      expected: true,
    });
  });

  test("throws ScaffoldStepError when spawned process exits non-zero", async () => {
    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "node", args: ["-e", "process.exit(1)"] },
        prompt: "build a thing",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawned process exits with non-zero code",
      should: "throw ScaffoldStepError",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_STEP_ERROR",
    });
  });

  test("resolves without error when spawned process exits zero", async () => {
    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "echo", args: [] },
        prompt: "hello",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawned process exits with code 0",
      should: "resolve without throwing",
      actual: error,
      expected: null,
    });
  });

  test("rejects with 'Argument list too long for spawn' message when spawn emits E2BIG", async () => {
    const proc = new EventEmitter();
    process.nextTick(() =>
      proc.emit(
        "error",
        Object.assign(new Error("spawn E2BIG"), { code: "E2BIG" }),
      ),
    );
    vi.mocked(spawn).mockImplementationOnce(() => /** @type {any} */ (proc));

    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "claude", args: ["-p"] },
        prompt: "a very long prompt",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawn emits E2BIG (argument list too long)",
      should: "reject with 'Argument list too long for spawn' message",
      actual: /** @type {any} */ (error)?.message?.includes(
        "Argument list too long for spawn",
      ),
      expected: true,
    });
  });

  test("rejects with 'Argument list too long for spawn' message when spawn emits ENOBUFS", async () => {
    const proc = new EventEmitter();
    process.nextTick(() =>
      proc.emit(
        "error",
        Object.assign(new Error("spawn ENOBUFS"), { code: "ENOBUFS" }),
      ),
    );
    vi.mocked(spawn).mockImplementationOnce(() => /** @type {any} */ (proc));

    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "claude", args: ["-p"] },
        prompt: "a very long prompt",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawn emits ENOBUFS (argument list too long)",
      should: "reject with 'Argument list too long for spawn' message",
      actual: /** @type {any} */ (error)?.message?.includes(
        "Argument list too long for spawn",
      ),
      expected: true,
    });
  });

  test("rejects with ScaffoldStepError when spawn emits ENOENT error event", async () => {
    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "nonexistent-binary-xyz-abc", args: [] },
        prompt: "do something",
        cwd: "/tmp",
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "agent command does not exist (ENOENT)",
      should: "reject with ScaffoldStepError instead of crashing the process",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_STEP_ERROR",
    });
  });
});
