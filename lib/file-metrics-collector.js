import { readFileSync } from "fs";
import path from "path";
import { gzipSync } from "zlib";
import { MetricsConfiguration, MetricsParser } from "tsmetrics-core";

// tsmetrics-core needs ts.ScriptTarget at runtime; it's a peerDep so we can't
// rely on it being auto-installed. We pass the numeric value directly to avoid
// importing typescript ourselves while keeping tsmetrics-core happy.
// ts.ScriptTarget.Latest === ts.ScriptTarget.ESNext === 99 (stable since TS 2.1)
const scriptTargetLatest = 99;

const jsTsExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

/**
 * @typedef {{ complexity: number, visible: boolean, children: MetricsNode[] }} MetricsNode
 * @typedef {{ loc: number, gzipRatio: number, complexity: number }} FileMetrics
 */

/** @param {MetricsNode} node @returns {number} */
const getComplexity = (node) => node.complexity ?? 0;

/** @param {MetricsNode} node @returns {MetricsNode[]} */
const getChildren = (node) => node.children ?? [];

/**
 * Cyclomatic complexity of a single function node:
 * sum the node's own score + direct children that are NOT function boundaries.
 * Nested functions are separate units and get their own M.
 *
 * @param {MetricsNode} node
 * @returns {number}
 */
const functionComplexity = (node) =>
  getComplexity(node) +
  getChildren(node)
    .filter((c) => !c.visible)
    .reduce((sum, c) => sum + getComplexity(c), 0);

/**
 * Walk the metrics tree, collect M for every function node (visible=true),
 * and return the maximum — the worst offender in the file.
 *
 * @param {MetricsNode} node
 * @returns {number}
 */
const maxFunctionComplexity = (node) => {
  const childMax = getChildren(node).reduce(
    (m, c) => Math.max(m, maxFunctionComplexity(c)),
    1,
  );
  return node.visible ? Math.max(functionComplexity(node), childMax) : childMax;
};

/**
 * @param {string} filePath
 * @param {string} src
 * @returns {number}
 */
const measureComplexity = (filePath, src) => {
  if (!jsTsExtensions.has(path.extname(filePath))) return 1;
  try {
    const result = MetricsParser.getMetricsFromText(
      filePath,
      src,
      MetricsConfiguration,
      scriptTargetLatest,
    );
    return maxFunctionComplexity(result.metrics);
  } catch {
    return 1;
  }
};

/**
 * Returns file metrics for each path: { loc, gzipRatio, complexity }.
 * Skips files that cannot be read (binary, missing, etc).
 *
 * @param {{ files: string[], cwd?: string }} options
 * @returns {Map<string, FileMetrics>}
 */
export const collectFileMetrics = ({ files, cwd = process.cwd() }) =>
  files.reduce((/** @type {Map<string, FileMetrics>} */ map, file) => {
    let src;
    try {
      src = readFileSync(path.resolve(cwd, file), "utf8");
    } catch {
      return map; // unreadable or missing — skip
    }
    const loc = src.split("\n").length;
    const buf = Buffer.from(src, "utf8");
    const gzipRatio = buf.length === 0 ? 0 : gzipSync(buf).length / buf.length;
    const complexity = measureComplexity(file, src);
    map.set(file, { complexity, gzipRatio, loc });
    return map;
  }, new Map());
