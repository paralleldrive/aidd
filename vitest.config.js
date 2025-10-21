/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "tests/**", "*.config.*", "stories/**"]
    },
    projects: [{
      extends: true,
      plugins: [react()],
      test: {
        name: 'default',
        environment: 'happy-dom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        globals: true
      }
    }]
    // Storybook project disabled until Playwright browsers are installed
    // Uncomment after running: npx playwright install chromium
    // , {
    //   extends: true,
    //   plugins: [
    //   storybookTest({
    //     configDir: path.join(dirname, '.storybook')
    //   })],
    //   test: {
    //     name: 'storybook',
    //     browser: {
    //       enabled: true,
    //       headless: true,
    //       provider: 'playwright',
    //       instances: [{
    //         browser: 'chromium'
    //       }]
    //     },
    //     setupFiles: ['.storybook/vitest.setup.js']
    //   }
    // }]
  }
});