/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["node_modules/**", "tests/**", "*.config.*"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    fileParallelism: true,
  },
});
