import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import base from "@repo/config/eslint.base.ts";

export default defineConfig(
  base,
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  { languageOptions: { globals: globals.browser } },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
