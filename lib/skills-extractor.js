import path from "path";
import fs from "fs-extra";
import matter from "gray-matter";
import { errorCauses, createError } from "error-causes";

// Error causes for skills extraction operations
const [{ SkillsExtractionError }] = errorCauses({
  SkillsExtractionError: {
    code: "SKILLS_EXTRACTION_ERROR",
    message: "Skills extraction failed",
  },
});

/**
 * Parse the Commands block from skill content
 * Returns array of { command, description }
 */
const parseCommandsBlock = (content) => {
  const commands = [];

  // Match Commands { ... } block
  const commandsMatch = content.match(/Commands\s*\{([^}]+)\}/s);
  if (!commandsMatch) {
    return commands;
  }

  const commandsContent = commandsMatch[1];

  // Match lines like: /command - description or /command <arg> - description
  const commandRegex = /^\s*(?:🔬\s*)?\/(\S+)(?:\s+([^-]+))?\s*-\s*(.+)$/gm;
  let match;

  while ((match = commandRegex.exec(commandsContent)) !== null) {
    const commandName = match[1].trim();
    const args = match[2] ? match[2].trim() : null;
    const description = match[3].trim();

    commands.push({
      name: commandName,
      args,
      description,
      full: args ? `/${commandName} ${args}` : `/${commandName}`,
    });
  }

  return commands;
};

/**
 * Read and parse a SKILL.md file
 */
const parseSkillFile = async (skillPath) => {
  const content = await fs.readFile(skillPath, "utf-8");
  const { data: frontmatter, content: body } = matter(content);

  const commands = parseCommandsBlock(body);

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    aiddCommands: frontmatter.aiddCommands || [],
    globs: frontmatter.globs,
    commands,
    skillPath,
  };
};

/**
 * Get all skill directories
 */
const getSkillDirectories = async (skillsPath) => {
  const items = await fs.readdir(skillsPath, { withFileTypes: true });
  const dirs = [];

  for (const item of items) {
    if (item.isDirectory()) {
      const skillFile = path.join(skillsPath, item.name, "SKILL.md");
      if (await fs.pathExists(skillFile)) {
        dirs.push({
          name: item.name,
          skillPath: skillFile,
        });
      }
    }
  }

  return dirs.sort((a, b) => a.name.localeCompare(b.name));
};

// Commands that should not be auto-generated (manually maintained)
const RESERVED_COMMANDS = ["help"];

/**
 * Get the primary command name for a skill
 * Primary command = skill short name (e.g., "aidd-discover" -> "discover")
 */
const getPrimaryCommandName = (skill) => {
  return skill.name.replace(/^aidd-/, "");
};

/**
 * Check if a command is the primary entry point for its skill
 * Only primary commands get top-level command files
 * Sub-commands are discovered when the skill is activated
 */
const isPrimaryCommand = (command, skill) => {
  const primaryName = getPrimaryCommandName(skill);
  return command.name === primaryName;
};

/**
 * Generate ai/commands/{command}.md file content
 */
const generateCommandFile = (command, skill) => {
  // Extract skill short name (e.g., "aidd-log" -> "log")
  const skillShortName = skill.name.replace(/^aidd-/, "");

  let content = `# /${command.name}\n\n`;
  content += `${command.description}\n\n`;
  content += `Use the ${skillShortName} skill to ${command.description.toLowerCase()}.\n`;

  return content;
};

/**
 * Generate skills/index.md content
 * Only primary commands are listed at top level; sub-commands are scoped within skills
 */
const generateSkillsIndex = (skills) => {
  let content = `# AIDD Skills\n\n`;
  content += `Agent skills for AI-Driven Development workflows.\n\n`;
  content += `## Primary Commands\n\n`;
  content += `These are the main entry points. Each command activates its corresponding skill.\n\n`;

  // Collect only PRIMARY commands for top-level listing
  const primaryCommands = [];
  for (const skill of skills) {
    for (const cmd of skill.commands) {
      if (isPrimaryCommand(cmd, skill)) {
        primaryCommands.push({
          ...cmd,
          skillName: skill.name,
          skillDescription: skill.description,
        });
      }
    }
  }

  // Sort commands alphabetically
  primaryCommands.sort((a, b) => a.name.localeCompare(b.name));

  for (const cmd of primaryCommands) {
    content += `- \`${cmd.full}\` - ${cmd.description}\n`;
  }

  content += `\n## Skills\n\n`;

  for (const skill of skills) {
    content += `### ${skill.name}\n\n`;
    content += `${skill.description}\n\n`;
    content += `**Skill:** [\`${skill.name}/SKILL.md\`](./${skill.name}/SKILL.md)\n\n`;

    if (skill.commands.length > 0) {
      content += `**Commands:**\n`;
      for (const cmd of skill.commands) {
        content += `- \`${cmd.full}\` - ${cmd.description}\n`;
      }
      content += `\n`;
    }
  }

  return content;
};

/**
 * Generate ai/commands/index.md content
 * Only lists primary entry point commands (sub-commands are scoped within skills)
 */
const generateCommandsIndex = (skills) => {
  let content = `# AIDD Commands\n\n`;
  content += `Primary workflow entry points. Each command activates its corresponding skill.\n\n`;
  content += `For complete command reference including sub-commands, see [skills/index.md](../../skills/index.md).\n\n`;
  content += `## Commands\n\n`;

  // Collect only primary commands
  const primaryCommands = [];
  for (const skill of skills) {
    for (const cmd of skill.commands) {
      if (isPrimaryCommand(cmd, skill)) {
        primaryCommands.push({
          ...cmd,
          skillName: skill.name,
          skillDescription: skill.description,
        });
      }
    }
  }

  // Sort alphabetically
  primaryCommands.sort((a, b) => a.name.localeCompare(b.name));

  for (const cmd of primaryCommands) {
    content += `### /${cmd.name}\n\n`;
    content += `${cmd.description}\n\n`;
    content += `**Skill:** [${cmd.skillName}](../../skills/${cmd.skillName}/SKILL.md)\n\n`;
  }

  return content;
};

/**
 * Main function to extract commands and generate files
 */
const extractCommands = async (targetBase) => {
  const skillsPath = path.join(targetBase, "skills");
  const commandsPath = path.join(targetBase, "ai", "commands");

  // Check if skills/ directory exists
  const skillsExist = await fs.pathExists(skillsPath);
  if (!skillsExist) {
    return {
      success: false,
      error: `skills/ directory not found at ${skillsPath}`,
      files: [],
    };
  }

  try {
    // Get all skill directories
    const skillDirs = await getSkillDirectories(skillsPath);

    // Parse all skills
    const skills = [];
    for (const dir of skillDirs) {
      const skill = await parseSkillFile(dir.skillPath);
      skills.push(skill);
    }

    const filesWritten = [];

    // Ensure commands directory exists
    await fs.ensureDir(commandsPath);

    // Generate command files ONLY for primary entry points
    // Sub-commands are scoped within skills and discovered when skill is activated
    for (const skill of skills) {
      for (const cmd of skill.commands) {
        if (RESERVED_COMMANDS.includes(cmd.name)) {
          continue;
        }
        // Only create top-level command files for primary entry points
        if (!isPrimaryCommand(cmd, skill)) {
          continue;
        }
        const cmdFileName = `${cmd.name}.md`;
        const cmdFilePath = path.join(commandsPath, cmdFileName);
        const cmdContent = generateCommandFile(cmd, skill);
        await fs.writeFile(cmdFilePath, cmdContent, "utf-8");
        filesWritten.push(cmdFilePath);
      }
    }

    // Generate skills/index.md
    const skillsIndexPath = path.join(skillsPath, "index.md");
    const skillsIndexContent = generateSkillsIndex(skills);
    await fs.writeFile(skillsIndexPath, skillsIndexContent, "utf-8");
    filesWritten.push(skillsIndexPath);

    // Generate ai/commands/index.md
    const commandsIndexPath = path.join(commandsPath, "index.md");
    const commandsIndexContent = generateCommandsIndex(skills);
    await fs.writeFile(commandsIndexPath, commandsIndexContent, "utf-8");
    filesWritten.push(commandsIndexPath);

    return {
      success: true,
      message: `Generated ${filesWritten.length} file(s)`,
      files: filesWritten,
      skills,
    };
  } catch (error) {
    throw createError({
      ...SkillsExtractionError,
      message: error?.message || String(error),
      cause: error,
    });
  }
};

/**
 * Generate all skill-related files
 */
const generateSkillsFiles = async (targetBase) => {
  try {
    const result = await extractCommands(targetBase);
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error?.message || String(error),
        cause: error?.cause,
      },
      files: [],
    };
  }
};

export {
  extractCommands,
  generateSkillsFiles,
  parseCommandsBlock,
  parseSkillFile,
  getSkillDirectories,
  generateCommandFile,
  generateSkillsIndex,
  generateCommandsIndex,
  getPrimaryCommandName,
  isPrimaryCommand,
};
