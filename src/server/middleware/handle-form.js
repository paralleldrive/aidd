/**
 * Form handling middleware factory with TypeBox validation
 */

import { TypeCompiler } from "@sinclair/typebox/compiler";

const log = (response, data) => {
  const logger = response.locals?.log || console.log;
  logger(data);
};

const formatErrors = (errors) => {
  return [...errors].map((err) => {
    const path = err.path.slice(1) || "root";

    if (err.message.includes("Required")) {
      return `Missing required field: ${path}`;
    }
    if (err.message.includes("Unexpected property")) {
      return `Undeclared field not allowed: ${path}`;
    }
    if (err.message.includes("Expected")) {
      return `Field '${path}' ${err.message.toLowerCase()}`;
    }
    return err.message;
  });
};

const handleForm =
  ({ name, schema, processSubmission, pii, honeypotField }) =>
  async ({ request, response }) => {
    // Register PII fields with logger scrubber
    if (pii?.length && response.locals?.logger?.scrub) {
      response.locals.logger.scrub(pii);
    }

    const body = request.body || {};

    // Check honeypot field if configured
    if (honeypotField && body[honeypotField]) {
      log(response, {
        message: "Form honeypot triggered",
        form: name,
        requestId: response.locals?.requestId,
      });
      response.status(400);
      response.json({
        errors: ["Validation failed"],
      });
      return { request, response };
    }

    // Validate against schema using TypeBox compiler
    const validator = TypeCompiler.Compile(schema);
    const valid = validator.Check(body);

    if (!valid) {
      const errors = formatErrors(validator.Errors(body));
      log(response, {
        message: "Form validation failed",
        form: name,
        requestId: response.locals?.requestId,
        errorCount: errors.length,
      });
      response.status(400);
      response.json({ errors });
      return { request, response };
    }

    // Process the validated submission
    await processSubmission(body);

    return { request, response };
  };

export { handleForm };
