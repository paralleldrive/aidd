/**
 * Test utilities for middleware testing
 * Provides mock request/response objects
 */

/**
 * Creates mock server object for testing middleware
 *
 * @param {{ request?: Partial<import('./index.js').Request>, response?: Partial<import('./index.js').Response> }} [options]
 * @returns {import('./index.js').ServerContext} Server object with request and response
 */
const createServer = ({ request = {}, response = {} } = {}) => {
  const headers = /** @type {Record<string, string | string[]>} */ ({});

  return /** @type {import('./index.js').ServerContext} */ ({
    request,
    response: {
      getHeader: (/** @type {string} */ key) => headers[key],
      setHeader: (
        /** @type {string} */ key,
        /** @type {string | string[]} */ value,
      ) => {
        headers[key] = value;
      },
      ...response,
    },
  });
};

export { createServer };
