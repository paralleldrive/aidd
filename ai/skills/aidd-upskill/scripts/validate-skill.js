/**
 * Validate an AgentSkills.io SKILL.md file.
 *
 * Usage: validate-skill ./path-to-skill-directory
 *        (compiled to a binary via `bun build --compile`)
 *        For development: bun run validate-skill.js ./path-to-skill-directory
 */

import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

export const parseSkillMd = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { body: content, frontmatter: "" };
  return {
    body: content.slice(match[0].length).trim(),
    frontmatter: match[1],
  };
};

export const validateName = (name, dirName) => {
  const errors = [];
  if (name.length < 1 || name.length > 64)
    errors.push("Name must be 1-64 characters");
  if (/[^a-z0-9-]/.test(name))
    errors.push("Name must be lowercase alphanumeric + hyphens only");
  if (!name.startsWith("aidd-"))
    errors.push("Name must start with 'aidd-' prefix");
  if (/^-|-$/.test(name)) errors.push("Name must not start or end with hyphen");
  if (/--/.test(name)) errors.push("Name must not contain consecutive hyphens");
  if (name !== dirName) errors.push("Name must match directory name");
  return errors;
};

export const calculateMetrics = (frontmatter, body) => ({
  bodyLines: body.split("\n").length,
  bodyTokens: Math.ceil(body.length / 4),
  frontmatterTokens: Math.ceil(frontmatter.length / 4),
});

const ALLOWED_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

export const validateFrontmatterKeys = (frontmatterObj) => {
  const errors = [];
  for (const key of Object.keys(frontmatterObj)) {
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
      errors.push(`Unknown frontmatter key: ${key}`);
    }
  }
  return errors;
};

export const checkThresholds = (metrics) => {
  const errors = [];
  const warnings = [];
  if (metrics.frontmatterTokens >= 100)
    warnings.push("Frontmatter reaches or exceeds 100 token guideline");
  if (metrics.bodyLines >= 500)
    errors.push(
      "Body exceeds 500 line spec limit - split into reference files",
    );
  else if (metrics.bodyLines >= 160)
    warnings.push("Body exceeds 160 line guideline");
  if (metrics.bodyTokens >= 5000)
    warnings.push("Body exceeds 5000 token spec guideline");
  return { errors, warnings };
};

/**
 * Parse and validate SKILL.md content against a known directory name.
 * Returns { errors, warnings, metrics }.
 */
export const validateSkillContent = (content, dirName) => {
  const { frontmatter, body } = parseSkillMd(content);
  const errors = [];
  let parsedFrontmatter;
  try {
    parsedFrontmatter = frontmatter ? yaml.load(frontmatter) : {};
  } catch (e) {
    errors.push(`Invalid YAML in frontmatter: ${e.message}`);
    const metrics = calculateMetrics(frontmatter, body);
    const { errors: thresholdErrors, warnings } = checkThresholds(metrics);
    return { errors: [...errors, ...thresholdErrors], metrics, warnings };
  }
  if (
    typeof parsedFrontmatter !== "object" ||
    parsedFrontmatter === null ||
    Array.isArray(parsedFrontmatter)
  ) {
    errors.push("Frontmatter must be a YAML mapping (key-value object)");
    const metrics = calculateMetrics(frontmatter, body);
    const { errors: thresholdErrors, warnings } = checkThresholds(metrics);
    return { errors: [...errors, ...thresholdErrors], metrics, warnings };
  }
  const name =
    typeof parsedFrontmatter.name === "string" ? parsedFrontmatter.name : "";
  const description =
    typeof parsedFrontmatter.description === "string"
      ? parsedFrontmatter.description
      : "";
  errors.push(...validateName(name, dirName));
  errors.push(...validateFrontmatterKeys(parsedFrontmatter));
  if (!description) errors.push("Description is required");
  const metrics = calculateMetrics(frontmatter, body);
  const { errors: thresholdErrors, warnings } = checkThresholds(metrics);
  return { errors: [...errors, ...thresholdErrors], metrics, warnings };
};

/** Resolves whether this module is the entry point (testable; mirrors CLI guard). */
export const resolveIsMainEntry = ({ main, argv1, moduleUrl }) =>
  typeof main !== "undefined" ? main : argv1 === fileURLToPath(moduleUrl);

const isMain = resolveIsMainEntry({
  argv1: process.argv[1],
  main: import.meta.main,
  moduleUrl: import.meta.url,
});

if (isMain) {
  const skillDir = process.argv[2];
  if (!skillDir) {
    console.error("Usage: validate-skill <path-to-skill-directory>");
    process.exit(1);
  }

  const dirName = basename(skillDir);
  let content;
  try {
    content = readFileSync(join(skillDir, "SKILL.md"), "utf8");
  } catch {
    console.error(`Error: could not read SKILL.md in ${skillDir}`);
    process.exit(1);
  }

  const { errors, metrics, warnings } = validateSkillContent(content, dirName);

  console.log(`\nValidating: ${skillDir}\n`);
  console.log("Metrics:");
  console.log(`  frontmatterTokens : ${metrics.frontmatterTokens}`);
  console.log(`  bodyLines         : ${metrics.bodyLines}`);
  console.log(`  bodyTokens        : ${metrics.bodyTokens}`);

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  ⚠  ${w}`);
  }

  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const e of errors) console.log(`  ✖  ${e}`);
    process.exit(1);
  }

  console.log(
    warnings.length > 0
      ? "\n⚠  Validation passed with warnings."
      : "\n✔  Validation passed.",
  );
}
