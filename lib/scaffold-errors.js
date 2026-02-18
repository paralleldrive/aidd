import { errorCauses } from "error-causes";

// Typed error causes for scaffold operations.
// handleScaffoldErrors enforces exhaustive handling at call-site:
// every key defined here MUST have a corresponding handler when called.
const [scaffoldErrors, handleScaffoldErrors] = errorCauses({
  ScaffoldCancelledError: {
    code: "SCAFFOLD_CANCELLED",
    message: "Scaffold operation cancelled",
  },
  ScaffoldNetworkError: {
    code: "SCAFFOLD_NETWORK_ERROR",
    message: "Failed to fetch remote scaffold",
  },
  ScaffoldStepError: {
    code: "SCAFFOLD_STEP_ERROR",
    message: "Scaffold step execution failed",
  },
});

const { ScaffoldCancelledError, ScaffoldNetworkError, ScaffoldStepError } =
  scaffoldErrors;

export {
  ScaffoldCancelledError,
  ScaffoldNetworkError,
  ScaffoldStepError,
  handleScaffoldErrors,
};
