#!/usr/bin/env node
/**
 * GitHub Actions helper: set step output `available` for ai-eval gating.
 * Exits 0 always so a bad or exhausted token does not fail the workflow job.
 */
// @ts-check

import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

import { resolveClaudeEvalAvailability } from "../lib/ci/claude-token-usable.js";

const probeTimeoutMs = 120_000;

const runClaudeProbe = () =>
  new Promise((resolve) => {
    const proc = spawn(
      "claude",
      [
        "-p",
        "Reply with exactly: OK",
        "--print",
        "--output-format",
        "text",
        "--permission-mode",
        "dontAsk",
        "--no-session-persistence",
      ],
      {
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };

    const timer = setTimeout(() => {
      proc.kill();
      finish(false);
    }, probeTimeoutMs);

    proc.on("error", () => finish(false));
    proc.on("close", (code) => finish(code === 0));
  });

const writeOutput = (available) => {
  const line = `available=${available}\n`;
  const path = process.env.GITHUB_OUTPUT;
  if (path) {
    appendFileSync(path, line, "utf8");
  } else {
    process.stdout.write(line);
  }
};

const token = process.env.CLAUDE_CODE_OAUTH_TOKEN ?? "";
const hasToken = token.trim().length > 0;

const main = async () => {
  let probeOk = false;
  if (hasToken) {
    probeOk = await runClaudeProbe();
  }

  const { available } = resolveClaudeEvalAvailability({
    probeOk,
    token,
  });

  writeOutput(available);

  if (!available && !hasToken) {
    console.log("⚠️ Skipping AI evals: CLAUDE_CODE_OAUTH_TOKEN not set");
  } else if (!available && hasToken) {
    console.log(
      "⚠️ Skipping AI evals: Claude Code probe failed (check token, quota, or claude CLI on PATH)",
    );
  }

  process.exitCode = 0;
};

main();
