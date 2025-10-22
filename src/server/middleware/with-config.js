/**
 * Loads configuration from environment variables
 *
 * @param {string[]} keys - Array of environment variable names to load
 * @returns {Promise<Object>} Config object with key-value pairs
 *
 * @example
 * const config = await loadConfigFromEnv(['DATABASE_URL', 'API_KEY', 'PORT']);
 * // => { DATABASE_URL: 'postgres://...', API_KEY: 'abc123', PORT: '3000' }
 */
const loadConfigFromEnv = async (keys = []) =>
  keys.reduce(
    (config, key) => ({
      ...config,
      [key]: process.env[key],
    }),
    {},
  );

/**
 * Config injection middleware factory
 * Loads configuration and attaches to response.locals
 *
 * @param {Function} configLoader - Async function that returns config
 * @returns {Function} Middleware function
 *
 * @example
 * // Using loadConfigFromEnv helper
 * import { createWithConfig, loadConfigFromEnv } from 'aidd/server';
 * const withConfig = createWithConfig(() =>
 *   loadConfigFromEnv(['DATABASE_URL', 'API_KEY'])
 * );
 *
 * @example
 * // Using custom loader
 * import { createWithConfig } from 'aidd/server';
 * const withConfig = createWithConfig(async () => {
 *   const config = await fetchFromConfigService();
 *   return config;
 * });
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

export { createWithConfig, loadConfigFromEnv };
