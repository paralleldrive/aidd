import { existsSync, renameSync, rmSync } from "fs";
import { join } from "path";

const stashDir = ".aidd-scaffold-stash";
const files = [
  "SCAFFOLD-MANIFEST.yml",
  "README.md",
  "index.md",
  "stash.js",
  "restore.js",
];

for (const file of files) {
  const src = join(stashDir, file);
  if (existsSync(src)) renameSync(src, file);
}

try {
  rmSync(stashDir, { force: true, recursive: true });
} catch (_e) {}
