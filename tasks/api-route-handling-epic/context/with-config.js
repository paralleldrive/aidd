/**
 * Config injection middleware
 * Loads configuration and attaches to response.locals
 */

import configure from "../../config/config";

const appendConfig = async (response) => {
  const config = await configure();
  if (!response.locals) response.locals = {};
  response.locals.config = config;
  return response;
};

const withConfig = async ({ request, response }) => ({
  request,
  response: await appendConfig(response),
});

export default withConfig;
