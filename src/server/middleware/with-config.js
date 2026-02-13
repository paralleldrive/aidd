import { createError } from "error-causes";

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
const loadConfigFromEnv = async (keys = []) => {
  const config = {};
  for (const key of keys) {
    config[key] = process.env[key];
  }
  return config;
};

/**
 * Creates a config object with a get() method that throws on missing keys
 *
 * @param {Object} configData - Raw config key-value pairs
 * @returns {Object} Config object with get() method
 *
 * @example
 * const config = createConfigObject({ API_KEY: 'abc123' });
 * config.get('API_KEY'); // => 'abc123'
 * config.get('MISSING'); // => throws caused error
 */
const createConfigObject = (configData) => ({
  get(key) {
    if (!(key in configData)) {
      throw createError({
        message: `Required configuration key "${key}" is not defined.`,
        name: "ConfigurationError",
        requestedKey: key,
      });
    }
    return configData[key];
  },
});

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
 * // In your handler
 * const apiKey = response.locals.config.get('API_KEY'); // throws if missing
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
    const configData = await configLoader();
    if (!response.locals) response.locals = {};
    response.locals.config = createConfigObject(configData);
    return response;
  };

  return async ({ request, response }) => ({
    request,
    response: await appendConfig(response),
  });
};

export { createWithConfig, loadConfigFromEnv, createConfigObject };
