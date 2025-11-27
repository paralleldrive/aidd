/**
 * Form handling middleware factory with JSON Schema validation
 */

import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

const formatErrors = (errors) => {
  return errors.map((err) => {
    if (err.keyword === "required") {
      return `Missing required field: ${err.params.missingProperty}`;
    }
    if (err.keyword === "additionalProperties") {
      return `Undeclared field not allowed: ${err.params.additionalProperty}`;
    }
    if (err.keyword === "type") {
      const field = err.instancePath.slice(1) || "root";
      return `Field '${field}' ${err.message}`;
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
      response.status(400);
      response.json({
        errors: ["Validation failed"],
      });
      return { request, response };
    }

    // Validate against schema
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      response.status(400);
      response.json({
        errors: formatErrors(validate.errors),
      });
      return { request, response };
    }

    // Process the validated submission
    await processSubmission(body);

    return { request, response };
  };

export { handleForm };
