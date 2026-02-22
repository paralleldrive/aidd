import path from "path";
import fs from "fs-extra";

const scaffoldCleanup = async ({ folder = process.cwd() } = {}) => {
  const aiddDir = path.join(folder, ".aidd");
  const exists = await fs.pathExists(aiddDir);

  if (!exists) {
    return {
      action: "not-found",
      message: "Nothing to clean up: .aidd/ does not exist.",
    };
  }

  await fs.remove(aiddDir);
  return { action: "removed", message: `Removed ${aiddDir}` };
};

export { scaffoldCleanup };
