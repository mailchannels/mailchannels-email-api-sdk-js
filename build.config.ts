import { defineBuildConfig } from "obuild/config";
import { rm } from "node:fs/promises";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: [
        "./src/mailchannels.ts",
        "./src/cli/index.ts",
        "./src/simulator/index.ts"
      ]
    }
  ],
  hooks: {
    async end () {
      await rm("dist/cli/index.d.mts");
    }
  }
});
