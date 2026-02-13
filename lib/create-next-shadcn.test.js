import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

// Mock modules before importing
vi.mock("child_process", () => ({
  spawn: vi.fn(),
  exec: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    readJson: vi.fn(),
    writeJson: vi.fn(),
    writeFile: vi.fn(),
    ensureDir: vi.fn(),
  },
  readJson: vi.fn(),
  writeJson: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
}));

vi.mock("util", () => ({
  promisify: vi.fn(),
}));

describe("executeCreateNextShadcn", () => {
  let childProcess;
  let fs;
  let spawnMock;
  let readJsonMock;
  let writeJsonMock;
  let writeFileMock;
  let ensureDirMock;

  beforeEach(async () => {
    childProcess = await import("child_process");
    fs = await import("fs-extra");

    spawnMock = vi.fn();
    readJsonMock = vi.fn();
    writeJsonMock = vi.fn();
    writeFileMock = vi.fn();
    ensureDirMock = vi.fn();

    childProcess.spawn.mockImplementation(spawnMock);
    fs.readJson.mockImplementation(readJsonMock);
    fs.writeJson.mockImplementation(writeJsonMock);
    fs.writeFile.mockImplementation(writeFileMock);
    fs.ensureDir.mockImplementation(ensureDirMock);

    // Default successful spawn implementation
    spawnMock.mockReturnValue({
      on: (event, callback) => {
        if (event === "close") {
          setTimeout(() => callback(0), 0);
        }
      },
    });

    // Default package.json
    readJsonMock.mockResolvedValue({
      name: "test-app",
      scripts: {},
    });

    writeJsonMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    ensureDirMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("should run create-next-app with correct flags", async () => {
    const spawnCalls = [];
    spawnMock.mockImplementation((cmd, args) => {
      spawnCalls.push({ cmd, args });
      return {
        on: (event, callback) => {
          if (event === "close") {
            setTimeout(() => callback(0), 0);
          }
        },
      };
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn("test-project");

    const createNextCall = spawnCalls.find(
      (call) =>
        call.cmd === "npx" &&
        call.args?.some((arg) => arg === "create-next-app@latest"),
    );

    assert({
      given: "executeCreateNextShadcn is called",
      should: "run create-next-app",
      actual: createNextCall !== undefined,
      expected: true,
    });

    assert({
      given: "create-next-app command",
      should: "include TypeScript flag",
      actual: createNextCall?.args?.includes("--typescript"),
      expected: true,
    });
  });

  test("should install aidd framework", async () => {
    const spawnCalls = [];
    spawnMock.mockImplementation((cmd, args) => {
      spawnCalls.push({ cmd, args });
      return {
        on: (event, callback) => {
          if (event === "close") {
            setTimeout(() => callback(0), 0);
          }
        },
      };
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn("test-project");

    const aiddInstall = spawnCalls.find(
      (call) => call.cmd === "npx" && call.args?.includes("aidd"),
    );

    assert({
      given: "executeCreateNextShadcn is called",
      should: "install aidd framework",
      actual: aiddInstall !== undefined,
      expected: true,
    });
  });

  test("should install test dependencies", async () => {
    const spawnCalls = [];
    spawnMock.mockImplementation((cmd, args) => {
      spawnCalls.push({ cmd, args });
      return {
        on: (event, callback) => {
          if (event === "close") {
            setTimeout(() => callback(0), 0);
          }
        },
      };
    });

    const { executeCreateNextShadcn } = await import("./create-next-shadcn.js");
    await executeCreateNextShadcn("test-project");

    const testDepsInstall = spawnCalls.find(
      (call) =>
        call.cmd === "npm" &&
        call.args?.some((arg) => arg === "vitest" || arg === "riteway"),
    );

    assert({
      given: "executeCreateNextShadcn is called",
      should: "install vitest and riteway",
      actual: testDepsInstall !== undefined,
      expected: true,
    });
  });
});
