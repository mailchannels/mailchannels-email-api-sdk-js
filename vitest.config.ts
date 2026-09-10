import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    isolate: true,
    root: fileURLToPath(new URL("./", import.meta.url)),
    coverage: {
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/types*", // No runtime code to test
        "src/simulator/**/*", // Do no test simulator
        "src/cli/index.ts" // CLI entry point not directly testable
      ]
    },
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
