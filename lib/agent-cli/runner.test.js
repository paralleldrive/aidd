import { EventEmitter } from "events";
import { assert } from "riteway/vitest";
import { beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  return { ...actual, spawn: vi.fn() };
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

  test("throws ScaffoldStepError when spawned process exits non-zero", async () => {
    vi.mocked(spawn).mockImplementationOnce(() => makeProcess({ exitCode: 1 }));

    let error = null;
    try {
      await runAgent({
        agentConfig: { command: "claude", args: ["-p"] },
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
    vi.mocked(spawn).mockImplementationOnce(() => makeProcess({ exitCode: 0 }));

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
      given: "spawned process exits with code 0",
      should: "resolve without throwing",
      actual: error,
      expected: null,
    });
  });
});
