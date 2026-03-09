import path from "path";

const jsTsExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

/**
 * Filters a list of file paths to only include JS/TS source files.
 *
 * @param {string[]} files
 * @returns {string[]}
 */
export const filterSourceFiles = (files) =>
  files.filter((file) => jsTsExtensions.has(path.extname(file)));
