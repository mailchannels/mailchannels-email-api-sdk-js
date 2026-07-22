import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.tsx"],
  format: "esm",
  platform: "neutral",
  target: "node20"
});
