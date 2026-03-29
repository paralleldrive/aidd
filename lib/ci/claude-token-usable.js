/**
 * Decide whether the GitHub Actions ai-eval job should run Claude-based prompt tests.
 *
 * @param {{ token: string | undefined, probeOk: boolean }} args
 * @returns {{ available: boolean }}
 */
export const resolveClaudeEvalAvailability = ({ token, probeOk }) => {
  const hasToken = typeof token === "string" && token.trim().length > 0;
  if (!hasToken) return { available: false };
  if (!probeOk) return { available: false };
  return { available: true };
};
