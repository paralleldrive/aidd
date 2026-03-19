import path from "path";

import { ensureAgentsMd } from "./agents-md.js";
import {
  createAiddCustomAgentsMd,
  createAiddCustomConfig,
} from "./aidd-custom/setup.js";
import { generateIndexRecursive } from "./index-generator.js";

const setupAgents = async ({ targetBase, verbose = false, logger }) => {
  verbose && logger.info("Setting up AGENTS.md...");
  const agentsResult = await ensureAgentsMd(targetBase);
  verbose && logger.verbose(`AGENTS.md: ${agentsResult.message}`);

  verbose && logger.info("Creating aidd-custom/config.yml...");
  const customConfigResult = await createAiddCustomConfig({ targetBase })();
  verbose && logger.verbose(`aidd-custom: ${customConfigResult.message}`);

  verbose && logger.info("Creating aidd-custom/AGENTS.md...");
  const customAgentsMdResult = await createAiddCustomAgentsMd({
    targetBase,
  })();
  verbose && logger.verbose(`aidd-custom: ${customAgentsMdResult.message}`);

  verbose && logger.info("Generating aidd-custom/index.md...");
  const customDir = path.join(targetBase, "aidd-custom");
  await generateIndexRecursive(customDir);
};

export { setupAgents };
