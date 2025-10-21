/**
 * Test utilities for middleware testing
 * Provides mock request/response objects
 */

const createServer = ({ request = {}, response = {} } = {}) => ({
  request,
  response,
});

export { createServer };
