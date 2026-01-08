import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import process from "process";

/**
 * Run a command and stream output to user
 */
const runCommand = (command, args = [], cwd = process.cwd()) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });

/**
 * Execute the create-next-shadcn command by automating Phase 1 setup
 * @param {string} projectName - Name of the project to create
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const executeCreateNextShadcn = async (projectName = "my-app") => {
  const projectPath = path.resolve(process.cwd(), projectName);

  try {
    console.log("🚀 Creating Next.js app...\n");

    // Step 1: Create Next.js app with defaults
    await runCommand("npx", [
      "create-next-app@latest",
      projectName,
      "--typescript",
      "--eslint",
      "--tailwind",
      "--app",
      "--no-src-dir",
      "--import-alias",
      "@/*",
      "--use-npm",
    ]);

    console.log("\n✅ Next.js app created\n");

    // Step 2: Install aidd
    console.log("📦 Installing aidd framework...\n");
    await runCommand("npx", ["aidd", "--cursor"], projectPath);
    await runCommand("npm", ["install", "aidd"], projectPath);

    console.log("\n✅ AIDD framework installed\n");

    // Step 3: Install test dependencies
    console.log("🧪 Installing test dependencies...\n");
    await runCommand(
      "npm",
      ["install", "-D", "vitest", "riteway", "@playwright/test", "@vitest/ui"],
      projectPath,
    );

    console.log("\n✅ Test dependencies installed\n");

    // Step 4: Install Storybook
    console.log("📚 Installing Storybook...\n");
    await runCommand("npx", ["storybook@latest", "init", "--yes"], projectPath);

    console.log("\n✅ Storybook installed\n");

    // Step 5: Update package.json scripts
    console.log("⚙️  Configuring npm scripts...\n");
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);

    packageJson.scripts = {
      ...packageJson.scripts,
      test: "vitest run && npm run -s lint && npm run -s typecheck",
      "test:watch": "vitest",
      "test:e2e": "playwright test",
      "test:ui": "vitest --ui",
      typecheck: "tsc --noEmit",
    };

    packageJson.type = "module";

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    console.log("✅ Package.json configured\n");

    // Step 6: Create baseline test file
    console.log("📝 Creating baseline tests...\n");
    const testDir = path.join(projectPath, "app");
    const testFile = path.join(testDir, "page.test.js");

    const testContent = `import { assert } from "riteway";
import { describe, test } from "vitest";

describe("Home page", () => {
  test("baseline test", () => {
    assert({
      given: "a baseline test",
      should: "pass",
      actual: true,
      expected: true,
    });
  });
});
`;

    await fs.writeFile(testFile, testContent);

    console.log("✅ Baseline test created\n");

    // Step 7: Create playwright config
    console.log("🎭 Configuring Playwright...\n");
    const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`;

    await fs.writeFile(
      path.join(projectPath, "playwright.config.js"),
      playwrightConfig,
    );

    // Create e2e test directory and sample test
    const e2eDir = path.join(projectPath, "e2e");
    await fs.ensureDir(e2eDir);

    const e2eTest = `import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Next/);
});
`;

    await fs.writeFile(path.join(e2eDir, "home.spec.js"), e2eTest);

    console.log("✅ Playwright configured\n");

    console.log("🎉 Phase 1 setup complete!\n");
    console.log(`📁 Project created at: ${projectPath}\n`);
    console.log("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log("  npm test          # Run unit tests");
    console.log("  npm run test:e2e  # Run E2E tests");
    console.log("  npm run storybook # Start Storybook");
    console.log("  npm run dev       # Start dev server\n");
    console.log(
      "💡 For Phase 2 (design system), use the /scaffold command with your preferred LLM",
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Setup failed: ${error.message}`,
    };
  }
};
