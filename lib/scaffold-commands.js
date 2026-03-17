import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import chalk from "chalk";

import { writeConfig } from "./aidd-config.js";
import { scaffoldCleanup } from "./scaffold-cleanup.js";
import { resolveCreateArgs, runCreate } from "./scaffold-create.js";
import { handleScaffoldErrors } from "./scaffold-errors.js";
import { runVerifyScaffold } from "./scaffold-verify-cmd.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// @ts-expect-error -- Commander error payload is untyped
const handleScaffoldCommandError = (err) =>
  handleScaffoldErrors({
    ScaffoldCancelledError: ({ message }) => {
      console.log(chalk.yellow(`\nℹ️  ${message}`));
      process.exit(0); // graceful cancellation — not an error
    },
    ScaffoldDestinationError: ({ message }) => {
      console.error(chalk.red(`\n❌ Destination conflict: ${message}`));
      console.error(
        chalk.yellow(
          "💡 Delete the folder or choose a different name before running aidd create",
        ),
      );
    },
    ScaffoldNetworkError: ({ message, cause }) => {
      console.error(chalk.red(`\n❌ Network Error: ${message}`));
      console.error(
        chalk.yellow("💡 Check your internet connection and try again"),
      );
      // @ts-expect-error -- error-causes 'cause' property is not in the static type
      if (cause?.cause) {
        // @ts-expect-error
        console.error(chalk.gray(`   Caused by: ${cause.cause.message}`));
      }
    },
    ScaffoldStepError: ({ message }) => {
      console.error(chalk.red(`\n❌ Step failed: ${message}`));
      console.error(
        chalk.yellow("💡 Check the scaffold manifest steps and try again"),
      );
      console.error(
        chalk.yellow(
          "💡 The project directory may be partially initialised — delete it before retrying.",
        ),
      );
    },
    ScaffoldValidationError: ({ message }) => {
      console.error(chalk.red(`\n❌ Invalid scaffold: ${message}`));
      console.error(
        chalk.yellow(
          "💡 Run `npx aidd verify-scaffold` to diagnose the manifest",
        ),
      );
    },
  })(err);

// Registers the scaffold subcommands on the Commander program instance.
// @ts-expect-error -- Commander program type is not declared in this JS module
const registerScaffoldCommands = (program) => {
  // Argument parsing rationale:
  //   create scaffold-example my-project  → typeOrFolder="scaffold-example", folder="my-project"
  //   create my-project                   → typeOrFolder="my-project",       folder=undefined
  //   create                              → typeOrFolder=undefined  → manual error
  //
  // Commander cannot parse `[type] <folder>` correctly when type is omitted and
  // only the folder is given — it would assign the single value to `type` and
  // report folder as missing. Using two optional args and validating manually
  // handles all three cases cleanly.
  program
    .command("create [typeOrFolder] [folder]")
    .description(
      "Scaffold a new app using a manifest-driven extension (default: next-shadcn)",
    )
    // Override the auto-generated usage so help shows the intended calling
    // convention rather than the internal [typeOrFolder] [folder] names.
    .usage("[options] [type] <folder>")
    .addHelpText(
      "after",
      `
Arguments:
  <folder>  (required) directory to create the new project in
  [type]    scaffold name, file:// URI, or https:// URL
            defaults to AIDD_CUSTOM_CREATE_URI env var, then "next-shadcn"

Examples:
  $ npx aidd create my-project
  $ npx aidd create scaffold-example my-project
  $ npx aidd create https://github.com/org/scaffold my-project
  $ npx aidd create file:///path/to/scaffold my-project
`,
    )
    .option("--agent <name>", "agent CLI to use for prompt steps", "claude")
    // @ts-expect-error -- Commander action callback parameters are untyped
    .action(async (typeOrFolder, folder, { agent }) => {
      const args = resolveCreateArgs(typeOrFolder, folder);
      if (!args) {
        console.error("error: missing required argument 'folder'");
        process.exit(1);
        return;
      }

      const { type, folderPath } = args;
      console.log(chalk.blue(`\nScaffolding new project in ${folderPath}...`));

      try {
        await runCreate({
          agent,
          folder: folderPath,
          packageRoot: __dirname,
          type,
        });

        console.log(chalk.green("\n✅ Scaffold complete!"));
        process.exit(0);
      } catch (err) {
        try {
          handleScaffoldCommandError(err);
        } catch {
          // @ts-expect-error
          console.error(chalk.red(`\n❌ Scaffold failed: ${err.message}`));
        }
        process.exit(1);
      }
    });

  program
    .command("verify-scaffold [type]")
    .description(
      "Validate a scaffold manifest before running it (named, file://, or HTTP/HTTPS)",
    )
    // @ts-expect-error -- Commander action callback parameters are untyped
    .action(async (type) => {
      try {
        const result = await runVerifyScaffold({
          packageRoot: __dirname,
          type,
        });

        if (result.valid) {
          console.log(chalk.green("✅ Scaffold is valid"));
          process.exit(0);
        } else {
          console.error(chalk.red("❌ Scaffold validation failed:"));
          for (const err of result.errors) {
            console.error(chalk.red(`   • ${err}`));
          }
          process.exit(1);
        }
      } catch (err) {
        try {
          handleScaffoldCommandError(err);
        } catch {
          // @ts-expect-error
          console.error(chalk.red(`\n❌ Verification failed: ${err.message}`));
        }
        process.exit(1);
      }
    });

  program
    .command("scaffold-cleanup")
    .description(
      "Remove the ~/.aidd/scaffold download directory created during scaffolding",
    )
    .action(async () => {
      try {
        const result = await scaffoldCleanup();

        if (result.action === "removed") {
          console.log(chalk.green(`✅ ${result.message}`));
        } else {
          console.log(chalk.yellow(`ℹ️  ${result.message}`));
        }
        process.exit(0);
      } catch (err) {
        // @ts-expect-error
        console.error(chalk.red(`❌ Cleanup failed: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command("set <key> <value>")
    .description("Save a user-level configuration value to ~/.aidd/config.yml")
    .addHelpText(
      "after",
      `
Valid keys:
  create-uri  Default scaffold URI used by \`npx aidd create\`.
              Priority: CLI <type> arg > AIDD_CUSTOM_CREATE_URI env var > ~/.aidd/config.yml

Examples:
  $ npx aidd set create-uri https://github.com/org/scaffold
  $ npx aidd set create-uri file:///path/to/my-scaffold
`,
    )
    // @ts-expect-error -- Commander action callback parameters are untyped
    .action(async (key, value) => {
      const VALID_KEYS = ["create-uri"];
      if (!VALID_KEYS.includes(key)) {
        console.error(
          chalk.red(
            `❌ Unknown setting: "${key}". Valid settings: ${VALID_KEYS.join(", ")}`,
          ),
        );
        process.exit(1);
        return;
      }

      try {
        await writeConfig({ updates: { [key]: value } });
        console.log(
          chalk.green(`✅ ${key} saved to ~/.aidd/config.yml: ${value}`),
        );
        process.exit(0);
      } catch (err) {
        // @ts-expect-error
        console.error(chalk.red(`❌ Failed to write config: ${err.message}`));
        process.exit(1);
      }
    });
};

export { registerScaffoldCommands };
