/**
 * Config injection middleware factory
 * Loads configuration and attaches to response.locals
 *
 * @param {Function} configLoader - Async function that returns config
 * @returns {Function} Middleware function
 *
 * @example
 * import configure from './config/config.js';
 * const withConfig = createWithConfig(configure);
 */

const createWithConfig = (configLoader) => {
  const appendConfig = async (response) => {
    const config = await configLoader();
    if (!response.locals) response.locals = {};
    response.locals.config = config;
    return response;
  };

  return async ({ request, response }) => ({
    request,
    response: await appendConfig(response),
  });
};

// Default export with no-op loader for testing
const withConfig = createWithConfig(async () => ({}));

export { createWithConfig };
export default withConfig;
