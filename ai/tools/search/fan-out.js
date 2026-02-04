/**
 * Fan-out search orchestrator.
 * Combines multiple search strategies and aggregates results.
 */

import { searchFts5 } from "./fts5.js";
import { searchMetadata } from "./metadata.js";

// Default strategy weights for ranking
const DEFAULT_WEIGHTS = {
  fts5: 1.0, // Full-text matches are strong
  metadata: 0.8, // Metadata matches are good
  semantic: 0.6, // Semantic search can be noisy (stubbed for now)
};

/**
 * Aggregate results from multiple search strategies.
 * Deduplicates by path and boosts documents found by multiple strategies.
 *
 * @param {Object} resultsByStrategy - { strategyName: results[] }
 * @param {Object} options
 * @param {Object} [options.weights] - Strategy weights for scoring
 * @param {number} [options.limit=20] - Maximum results to return
 * @returns {Array<{path: string, type: string, frontmatter: object, relevanceScore: number}>}
 */
const aggregateResults = (
  resultsByStrategy,
  { weights = DEFAULT_WEIGHTS, limit = 20 } = {},
) => {
  const scored = new Map(); // path -> { doc, score }

  for (const [strategy, results] of Object.entries(resultsByStrategy)) {
    const weight = weights[strategy] ?? 0.5;

    results.reduce((acc, doc, idx) => {
      // Position-based score (first result = highest)
      const positionScore = 1 / (idx + 1);
      const score = weight * positionScore;

      if (acc.has(doc.path)) {
        // Boost if found by multiple strategies
        const existing = acc.get(doc.path);
        existing.score += score;
        existing.matchedStrategies.push(strategy);
      } else {
        acc.set(doc.path, {
          doc: {
            path: doc.path,
            type: doc.type,
            frontmatter: doc.frontmatter,
            snippet: doc.snippet,
          },
          score,
          matchedStrategies: [strategy],
        });
      }
      return acc;
    }, scored);
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score, matchedStrategies }) => ({
      ...doc,
      relevanceScore: score,
      matchedStrategies,
    }));
};

/**
 * Stub for semantic search (RAG integration).
 * Will be implemented when RAG capabilities are available.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} query
 * @returns {Promise<Array>}
 */
const searchSemantic = async (db, query) => {
  // Stub - returns empty array
  // See: https://github.com/paralleldrive/aidd/issues/89
  return [];
};

/**
 * Execute fan-out search across multiple strategies.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} query - Search query
 * @param {Object} options
 * @param {Array<string>} [options.strategies=['fts5', 'metadata']] - Strategies to use
 * @param {Object} [options.filters] - Metadata filters
 * @param {string} [options.type] - Document type filter
 * @param {number} [options.limit=20] - Maximum results
 * @param {Object} [options.weights] - Strategy weights
 * @param {boolean} [options.silent=false] - Suppress error logging
 * @returns {Promise<Array<{path: string, type: string, frontmatter: object, relevanceScore: number}>>}
 */
const fanOutSearch = async (
  db,
  query,
  {
    strategies = ["fts5", "metadata"],
    filters = {},
    type,
    limit = 20,
    weights = DEFAULT_WEIGHTS,
    silent = false,
  } = {},
) => {
  if (!query || query.trim() === "") {
    return [];
  }

  // Build search functions for each strategy
  const searchFns = {
    fts5: () => searchFts5(db, query, { type, limit: limit * 2, silent }),
    metadata: () => {
      // Only run metadata search if filters are provided
      const hasFilters = Object.keys(filters).length > 0 || type;
      if (!hasFilters) {
        return [];
      }
      // Combine type filter with other filters
      const allFilters = { ...filters };
      if (type) {
        allFilters.type = type;
      }
      return searchMetadata(db, allFilters, { limit: limit * 2 });
    },
    semantic: () => searchSemantic(db, query),
  };

  // Execute active strategies in parallel
  const activeStrategies = strategies.filter((s) => searchFns[s]);

  const results = await Promise.all(
    activeStrategies.map(async (strategy) => {
      try {
        const strategyResults = await searchFns[strategy]();
        return [strategy, strategyResults];
      } catch (err) {
        if (!silent) {
          console.error(`Search strategy '${strategy}' failed: ${err.message}`);
        }
        return [strategy, []];
      }
    }),
  );

  // Convert to object
  const resultsByStrategy = Object.fromEntries(results);

  // Aggregate and rank
  return aggregateResults(resultsByStrategy, { weights, limit });
};

export { fanOutSearch, aggregateResults, DEFAULT_WEIGHTS };
