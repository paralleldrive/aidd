import chalk from "chalk";

/** @typedef {import('./churn-scorer.js').ScoredFile} ScoredFile */

const HEADERS = ["Score", "LoC", "Churn", "Cx", "Density", "File"];

/** @param {ScoredFile} result */
const row = ({ score, loc, churn, complexity, gzipRatio, file }) => [
  score.toLocaleString(),
  String(loc),
  String(churn),
  String(complexity),
  `${(gzipRatio * 100).toFixed(0)}%`,
  file,
];

/** @param {string} str @param {number} width */
const pad = (str, width) => str.padStart(width);

/** @param {ScoredFile[]} results */
export const formatTable = (results) => {
  if (results.length === 0) {
    return chalk.green("✅ No hotspots found above the current thresholds.");
  }

  const rows = results.map(row);
  const allRows = [HEADERS, ...rows];
  const widths = HEADERS.map((_, i) =>
    Math.max(...allRows.map((r) => r[i].length)),
  );

  const divider = widths.map((w) => "─".repeat(w)).join("  ");
  /** @param {string[]} r */
  const fmt = (r) =>
    r
      .map((cell, i) =>
        i === widths.length - 1 ? cell.padEnd(widths[i]) : pad(cell, widths[i]),
      )
      .join("  ");

  return [
    chalk.bold(fmt(HEADERS)),
    chalk.gray(divider),
    ...rows.map((r) => fmt(r)),
  ].join("\n");
};

/** @param {ScoredFile[]} results */
export const formatJson = (results) => JSON.stringify(results, null, 2);
