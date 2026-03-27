const fs = require("fs");
const path = require("path");

const stashDir = ".aidd-scaffold-stash";
const files = ["SCAFFOLD-MANIFEST.yml", "README.md", "index.md"];

fs.mkdirSync(stashDir, { recursive: true });

for (const file of files) {
  try {
    fs.renameSync(file, path.join(stashDir, file));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
