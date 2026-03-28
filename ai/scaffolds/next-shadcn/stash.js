import { mkdirSync, renameSync } from "fs";
import { join } from "path";

const stashDir = ".aidd-scaffold-stash";
const files = [
  "SCAFFOLD-MANIFEST.yml",
  "README.md",
  "index.md",
  "stash.js",
  "restore.js",
];

mkdirSync(stashDir, { recursive: true });

for (const file of files) {
  try {
    renameSync(file, join(stashDir, file));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
