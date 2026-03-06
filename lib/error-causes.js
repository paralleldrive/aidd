import { errorCauses } from "error-causes";

const [, handleCliErrors] = errorCauses({
  CloneError: { code: "CLONE_ERROR", message: "AI folder cloning failed" },
  FileSystemError: {
    code: "FILESYSTEM_ERROR",
    message: "File system operation failed",
  },
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
});

export { handleCliErrors };
