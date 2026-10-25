import { defineConfig } from "eslint/config";
import globals from "globals";
import base from "@repo/config/eslint.base.ts";

export default defineConfig(
  base,
  { languageOptions: { globals: globals.node } },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
