/**
 * Test utilities for middleware testing
 * Provides mock request/response objects
 */

/**
 * Creates mock server object for testing middleware
 * @param {Object} options
 * @param {Object} options.request - Mock request object
 * @param {Object} options.response - Mock response object
 * @returns {Object} Server object with request and response
 */
const createServer = ({ request = {}, response = {} } = {}) => {
  const headers = {};

  return {
    request,
    response: {
      setHeader: (key, value) => {
        headers[key] = value;
      },
      getHeader: (key) => headers[key],
      ...response,
    },
  };
};

export { createServer };
