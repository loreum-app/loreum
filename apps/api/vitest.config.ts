import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "generated/prisma": path.resolve(__dirname, "./generated/prisma"),
    },
  },
  esbuild: false,
  oxc: false,
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
      },
    }),
  ],
});
