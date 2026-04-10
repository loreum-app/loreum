import { config } from "@loreum/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      "react/prop-types": "off",
    },
  },
];
