// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("prettier"), {
  plugins: {
    prettier: (await import("eslint-plugin-prettier")).default,
  },
  rules: {
    "prettier/prettier": "error",
  },
}, {
  ignores: ["node_modules/**", "coverage/**"],
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
