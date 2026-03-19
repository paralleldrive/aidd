import { errorCauses } from "error-causes";

// Typed error causes for scaffold operations.
// handleScaffoldErrors enforces exhaustive handling at call-site:
// every key defined here MUST have a corresponding handler when called.
const [scaffoldErrors, handleScaffoldErrors] = errorCauses({
  ScaffoldCancelledError: {
    code: "SCAFFOLD_CANCELLED",
    message: "Scaffold operation cancelled",
  },
  ScaffoldDestinationError: {
    code: "SCAFFOLD_DESTINATION_ERROR",
    message: "Destination folder already exists",
  },
  ScaffoldNetworkError: {
    code: "SCAFFOLD_NETWORK_ERROR",
    message: "Failed to fetch remote scaffold",
  },
  ScaffoldStepError: {
    code: "SCAFFOLD_STEP_ERROR",
    message: "Scaffold step execution failed",
  },
  ScaffoldValidationError: {
    code: "SCAFFOLD_VALIDATION_ERROR",
    message: "Scaffold manifest is invalid",
  },
});

const {
  ScaffoldCancelledError,
  ScaffoldDestinationError,
  ScaffoldNetworkError,
  ScaffoldStepError,
  ScaffoldValidationError,
} = scaffoldErrors;

export {
  handleScaffoldErrors,
  ScaffoldCancelledError,
  ScaffoldDestinationError,
  ScaffoldNetworkError,
  ScaffoldStepError,
  ScaffoldValidationError,
};
