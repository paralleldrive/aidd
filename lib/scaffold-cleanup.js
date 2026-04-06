import fs from "fs-extra";

import { SCAFFOLD_DOWNLOAD_DIR } from "./scaffold-resolver.js";

const scaffoldCleanup = async ({
  scaffoldDir = SCAFFOLD_DOWNLOAD_DIR,
} = {}) => {
  const exists = await fs.pathExists(scaffoldDir);

  if (!exists) {
    return {
      action: "not-found",
      message: "Nothing to clean up: ~/.aidd/scaffold/ does not exist.",
    };
  }

  await fs.remove(scaffoldDir);
  return { action: "removed", message: `Removed ${scaffoldDir}` };
};

export { scaffoldCleanup };
