import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import base from "@repo/config/eslint.base.ts";

export default defineConfig(
  base,
  reactHooks.configs.flat["recommended-latest"],
  { languageOptions: { globals: globals.browser } },
  {
    // scoped to TS files: these rules need type information, which eslint.config.js does not have
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // the generic type machinery relies on `any` (e.g. `(...args: any[]) => any` constraints)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
);
