import { config } from "@loreum/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["dist/**", "generated/**", "prisma/seed.ts"],
  },
  {
    files: ["src/test/**"],
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
