/**
 * Error definitions for the AIDD tools module.
 * Uses error-causes for structured error handling.
 */

import { errorCauses } from "error-causes";

const [toolsErrors, handleToolsErrors] = errorCauses({
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
});

const { ValidationError } = toolsErrors;

export { toolsErrors, handleToolsErrors, ValidationError };
