import { readFileSync } from "fs";
import path from "path";
import { gzipSync } from "zlib";
import { MetricsConfiguration, MetricsParser } from "tsmetrics-core";
import ts from "typescript";

import { jsTsExtensions } from "./churn-filters.js";

/** @typedef {{ complexity: number, visible: boolean, children: MetricsNode[] }} MetricsNode */

/**
 * Cyclomatic complexity of a single function node:
 * sum the node's own score + direct children that are NOT function boundaries.
 * Nested functions are separate units and get their own M.
 *
 * @param {MetricsNode} node
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
 * @param {MetricsNode} node
 * @returns {number}
 */
const maxFunctionComplexity = (node) => {
  const childMax = (node.children ?? []).reduce(
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
      ts.ScriptTarget.Latest,
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
 * @returns {Map<string, { loc: number, gzipRatio: number, complexity: number }>}
 */
export const collectFileMetrics = ({ files, cwd = process.cwd() }) =>
  files.reduce(
    (
      /** @type {Map<string, { loc: number, gzipRatio: number, complexity: number }>} */ map,
      file,
    ) => {
      let src;
      try {
        src = readFileSync(path.resolve(cwd, file), "utf8");
      } catch {
        return map; // unreadable or missing — skip
      }
      const loc = src.split("\n").length;
      const buf = Buffer.from(src, "utf8");
      const gzipRatio = gzipSync(buf).length / buf.length;
      const complexity = measureComplexity(file, src);
      map.set(file, { complexity, gzipRatio, loc });
      return map;
    },
    new Map(),
  );
