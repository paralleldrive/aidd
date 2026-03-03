/**
 * Create a form handler with validation, honeypot support, and PII scrubbing.
 *
 * @param {{ name: string, schema: import('@sinclair/typebox').TObject, processSubmission: (body: Record<string, unknown>) => Promise<void>, pii?: string[], honeypotField?: string }} opts
 * @returns {Function} Middleware function that validates and processes the form
 *
 * @example
 * const withContactForm = handleForm({
 *   name: 'contact',
 *   schema: Type.Object({ email: Type.String() }),
 *   processSubmission: async (body) => { await sendEmail(body.email); },
 *   pii: ['email'],
 *   honeypotField: 'website',
 * });
 */

import { TypeCompiler } from "@sinclair/typebox/compiler";

/** @param {any} response @param {any} data */
const log = (response, data) => {
  const logger = response.locals?.log || console.log;
  logger(data);
};

/** @param {Iterable<{ path: string, message: string }>} errors */
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

const handleForm = (
  /** @type {{ name: string, schema: import('@sinclair/typebox').TObject, processSubmission: (body: Record<string, unknown>) => Promise<void>, pii?: string[], honeypotField?: string }} */ {
    name,
    schema,
    processSubmission,
    pii,
    honeypotField,
  },
) => {
  // Validate required parameters at factory creation time
  if (!name) throw new Error("handleForm: name is required");
  if (!schema) throw new Error("handleForm: schema is required");
  if (!processSubmission)
    throw new Error("handleForm: processSubmission is required");

  // Compile schema once when middleware is created, not on every request
  const validator = TypeCompiler.Compile(schema);

  return async (
    /** @type {import('../index.js').ServerContext} */ { request, response },
  ) => {
    // Don't process if a prior middleware already rejected the request
    if (response.statusCode && response.statusCode >= 400) {
      return { request, response };
    }

    // Register PII fields with logger scrubber
    if (pii?.length && response.locals?.logger?.scrub) {
      response.locals.logger.scrub(pii);
    }

    // Strip _csrf token from body before validation (used by withCSRF middleware)
    const { _csrf, ...body } = request.body || {};

    // Check honeypot field if configured
    if (honeypotField && body[honeypotField]) {
      log(response, {
        form: name,
        message: "Form honeypot triggered",
        requestId: response.locals?.requestId,
      });
      response.status(400);
      response.json({
        errors: ["Validation failed"],
      });
      return { request, response };
    }

    // Validate against pre-compiled schema
    const valid = validator.Check(body);

    if (!valid) {
      const errors = formatErrors(validator.Errors(body));
      log(response, {
        errorCount: errors.length,
        form: name,
        message: "Form validation failed",
        requestId: response.locals?.requestId,
      });
      response.status(400);
      response.json({ errors });
      return { request, response };
    }

    // Process the validated submission
    await processSubmission(body);

    return { request, response };
  };
};

export { handleForm };
