// @ts-nocheck
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readmePath = path.resolve(
  __dirname,
  "../ai/scaffolds/scaffold-example/README.md",
);
const readme = fs.readFileSync(readmePath, "utf8");

describe("scaffold-example README", () => {
  test("lists release-it as a dependency", () => {
    assert({
      given: "the scaffold-example README",
      should: "list release-it as an installed dependency",
      actual: readme.includes("release-it"),
      expected: true,
    });
  });

  test("mentions the npm run release script", () => {
    assert({
      given: "the scaffold-example README",
      should: "mention the configured npm run release script",
      actual: readme.includes("release"),
      expected: true,
    });
  });
});
