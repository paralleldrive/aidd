// @ts-nocheck
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import chalk from "chalk";

import { writeConfig } from "./aidd-config.js";
import { scaffoldCleanup } from "./scaffold-cleanup.js";
import { resolveCreateArgs, runCreate } from "./scaffold-create.js";
import { handleScaffoldErrors } from "./scaffold-errors.js";
import { runVerifyScaffold } from "./scaffold-verify-cmd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registers the scaffold subcommands on the Commander program instance.
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
        const result = await runCreate({
          agent,
          folder: folderPath,
          packageRoot: __dirname,
          type,
        });

        console.log(chalk.green("\n✅ Scaffold complete!"));
        if (result.cleanupTip) {
          console.log(
            chalk.yellow(
              `\n💡 Tip: Run \`${result.cleanupTip}\` to remove the downloaded extension files.`,
            ),
          );
        }
        process.exit(0);
      } catch (err) {
        try {
          handleScaffoldErrors({
            ScaffoldCancelledError: ({ message }) => {
              console.log(chalk.yellow(`\nℹ️  ${message}`));
              process.exit(0); // graceful cancellation — not an error
            },
            ScaffoldNetworkError: ({ message, cause }) => {
              console.error(chalk.red(`\n❌ Network Error: ${message}`));
              console.error(
                chalk.yellow("💡 Check your internet connection and try again"),
              );
              if (cause?.cause) {
                console.error(
                  chalk.gray(`   Caused by: ${cause.cause.message}`),
                );
              }
            },
            ScaffoldStepError: ({ message }) => {
              console.error(chalk.red(`\n❌ Step failed: ${message}`));
              console.error(
                chalk.yellow(
                  "💡 Check the scaffold manifest steps and try again",
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
        } catch {
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
          handleScaffoldErrors({
            ScaffoldCancelledError: ({ message }) => {
              console.log(chalk.yellow(`\nℹ️  ${message}`));
              process.exit(0); // graceful cancellation — not an error
            },
            ScaffoldNetworkError: ({ message }) => {
              console.error(chalk.red(`\n❌ Network Error: ${message}`));
            },
            ScaffoldStepError: ({ message }) => {
              console.error(chalk.red(`\n❌ Step failed: ${message}`));
            },
            ScaffoldValidationError: ({ message }) => {
              console.error(chalk.red(`\n❌ Invalid scaffold: ${message}`));
            },
          })(err);
        } catch {
          console.error(chalk.red(`\n❌ Verification failed: ${err.message}`));
        }
        process.exit(1);
      }
    });

  program
    .command("scaffold-cleanup [folder]")
    .description(
      "Remove the .aidd/ working directory created during scaffolding",
    )
    .action(async (folder) => {
      const folderPath = folder
        ? path.resolve(process.cwd(), folder)
        : process.cwd();

      try {
        const result = await scaffoldCleanup({ folder: folderPath });

        if (result.action === "removed") {
          console.log(chalk.green(`✅ ${result.message}`));
        } else {
          console.log(chalk.yellow(`ℹ️  ${result.message}`));
        }
        process.exit(0);
      } catch (err) {
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
        console.error(chalk.red(`❌ Failed to write config: ${err.message}`));
        process.exit(1);
      }
    });
};

export { registerScaffoldCommands };
