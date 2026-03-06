import { readFileSync } from "fs";
import path from "path";
import { gzipSync } from "zlib";
import { MetricsConfiguration, MetricsParser } from "tsmetrics-core";

const JS_TS_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
]);

/**
 * Cyclomatic complexity of a single function node:
 * sum the node's own score + direct children that are NOT function boundaries.
 * Nested functions are separate units and get their own M.
 *
 * @param {{ complexity: number, visible: boolean, children: any[] }} node
 * @returns {number}
 */
const functionComplexity = (node) =>
  (node.complexity ?? 0) +
  (node.children ?? [])
    .filter((c) => !c.visible)
    .reduce((sum, c) => sum + (c.complexity ?? 0), 0);

/**
 * Walk the metrics tree, collect M for every function node (visible=true),
 * and return the maximum — the worst offender in the file.
 *
 * @param {{ complexity: number, visible: boolean, children: any[] }} node
 * @returns {number}
 */
const maxFunctionComplexity = (node) => {
  const childMax = (node.children ?? []).reduce(
    (m, c) => Math.max(m, maxFunctionComplexity(c)),
    1,
  );
  return node.visible ? Math.max(functionComplexity(node), childMax) : childMax;
};

const measureComplexity = (filePath, src) => {
  if (!JS_TS_EXTENSIONS.has(path.extname(filePath))) return 1;
  try {
    const result = MetricsParser.getMetricsFromText(
      filePath,
      src,
      MetricsConfiguration,
    );
    return maxFunctionComplexity(result.metrics);
  } catch {
    return 1;
  }
};

/**
 * Returns file metrics for each path: { loc, gzipRatio, complexity }.
 * Skips files that cannot be read (binary, missing, etc).
 */
export const collectFileMetrics = ({ files, cwd = process.cwd() }) =>
  files.reduce((map, file) => {
    try {
      const src = readFileSync(path.resolve(cwd, file), "utf8");
      const loc = src.split("\n").length;
      const buf = Buffer.from(src, "utf8");
      const gzipRatio = gzipSync(buf).length / buf.length;
      const complexity = measureComplexity(file, src);
      map.set(file, { complexity, gzipRatio, loc });
    } catch {
      // skip unreadable files silently
    }
    return map;
  }, new Map());
