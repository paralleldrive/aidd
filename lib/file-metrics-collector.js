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

const sumComplexity = (node) =>
  (node.complexity ?? 0) +
  (node.children ?? []).reduce((sum, child) => sum + sumComplexity(child), 0);

const measureComplexity = (filePath, src) => {
  if (!JS_TS_EXTENSIONS.has(path.extname(filePath))) return 1;
  try {
    const result = MetricsParser.getMetricsFromText(
      filePath,
      src,
      MetricsConfiguration,
    );
    return Math.max(1, sumComplexity(result.metrics));
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
