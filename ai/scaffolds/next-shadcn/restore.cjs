const fs = require("fs");
const path = require("path");

const stashDir = ".aidd-scaffold-stash";
const files = [
  "SCAFFOLD-MANIFEST.yml",
  "README.md",
  "index.md",
  "stash.cjs",
  "restore.cjs",
];

for (const file of files) {
  const src = path.join(stashDir, file);
  if (fs.existsSync(src)) fs.renameSync(src, file);
}

try {
  fs.rmSync(stashDir, { force: true, recursive: true });
} catch (_e) {}
