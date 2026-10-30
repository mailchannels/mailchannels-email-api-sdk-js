import { defineBuildConfig } from "obuild/config";
import { rm } from "node:fs/promises";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: [
        "./src/mailchannels.ts",
        "./src/cli/index.ts",
        "./src/simulator/index.ts",
        "./src/plugins/nodemailer/index.ts"
      ],
      rolldown: {
        external: [/^nodemailer(?:\/|$)/]
      }
    }
  ],
  hooks: {
    rolldownConfig (config) {
      const external = config.external;
      config.external = (id, importer, isResolved) => {
        // Inline the exposed request declarations so their undici import resolves
        // from this package's declared dependency, even with isolated installs.
        if (id === "ofetch" && importer && /\.d\.[cm]?ts$/.test(importer)) return false;
        if (typeof external === "function") return external(id, importer, isResolved);
        return (Array.isArray(external) ? external : [external]).some(pattern =>
          typeof pattern === "string"
            ? pattern === id
            : pattern instanceof RegExp && pattern.test(id)
        );
      };
    },
    async end () {
      await rm("dist/cli/index.d.mts");
    }
  }
});
