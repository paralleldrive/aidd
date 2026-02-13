/**
 * Validate an AgentSkills.io SKILL.md file.
 *
 * Usage: node validate-skill.js ./path-to-skill-directory
 */

export const parseSkillMd = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
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

export const checkThresholds = (metrics) => {
  const warnings = [];
  if (metrics.frontmatterTokens >= 100)
    warnings.push("Frontmatter exceeds 100 token guideline");
  if (metrics.bodyLines >= 160)
    warnings.push("Body exceeds 160 line guideline");
  if (metrics.bodyLines >= 500)
    warnings.push(
      "Body exceeds 500 line spec limit - split into reference files",
    );
  if (metrics.bodyTokens >= 5000)
    warnings.push("Body exceeds 5000 token spec guideline");
  return warnings;
};
