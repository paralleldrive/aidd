/**
 * @typedef {{ loc: number, gzipRatio: number, complexity: number }} FileMetrics
 * @typedef {{ file: string, score: number, loc: number, churn: number, complexity: number, gzipRatio: number }} ScoredFile
 */

/**
 * Merges churn counts and file metrics into a ranked list of hotspot scores.
 * score = loc * churn * complexity  (gzipRatio is a supplemental display column)
 *
 * @param {Map<string, number>} churnMap
 * @param {Map<string, FileMetrics>} metricsMap
 * @param {{ top?: number, minLoc?: number }} [options]
 * @returns {ScoredFile[]}
 */
export const scoreFiles = (
  churnMap,
  metricsMap,
  { top = 20, minLoc = 50 } = {},
) =>
  [...metricsMap.entries()]
    .filter(([, { loc }]) => loc >= minLoc)
    .map(([file, { loc, gzipRatio, complexity }]) => {
      const churn = churnMap.get(file) ?? 0;
      return {
        churn,
        complexity,
        file,
        gzipRatio,
        loc,
        score: loc * churn * complexity,
      };
    })
    .filter(({ churn }) => churn > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
