import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "typescript"],
  jsPlugins: [
    "@stylistic/eslint-plugin"
  ],
  rules: {
    "no-console": ["error", { allow: ["info", "warn", "error", "table"] }],
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
    "no-unused-vars": "error",
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "import/no-named-default": "error",
    "import/no-self-import": "error",
    "@stylistic/max-len": ["error", {
      code: 100,
      ignoreComments: true,
      ignorePattern: [
        // Standalone strings, assignments, and return statements
        "^\\s*(?:(?:const|let|var)\\s+\\w+\\s*=\\s*|return\\s+)?(['\"`]).*\\1\\s*[,;]?$",
        // Object properties, including computed enum keys
        "^\\s*(?:\\w+|\\[[\\w$.]+\\])\\s*:\\s*(['\"`]).*\\1\\s*,?\\s*$",
        // Test descriptions
        "\\b(?:it|test|describe)\\s*\\(\\s*(['\"`]).*?\\1\\s*,"
      ].join("|")
    }],
    "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
    "@stylistic/linebreak-style": ["error", process.platform === "win32" ? "windows" : "unix"],
    "@stylistic/quotes": ["error", "double"],
    "@stylistic/semi": ["error", "always"],
    "@stylistic/no-extra-semi": "error",
    "@stylistic/comma-dangle": ["error", "never"],
    "@stylistic/space-before-function-paren": ["error", "always"],
    "@stylistic/multiline-ternary": ["error", "always-multiline"],
    "@stylistic/member-delimiter-style": ["error", {
      multiline: { delimiter: "semi" },
      singleline: { delimiter: "comma" }
    }],
    "@stylistic/arrow-spacing": ["error", { before: true, after: true }],
    "@stylistic/brace-style": ["error", "stroustrup", { allowSingleLine: true }],
    "@stylistic/no-multi-spaces": "error",
    "@stylistic/space-before-blocks": "error",
    "@stylistic/no-trailing-spaces": "error",
    "@stylistic/array-bracket-spacing": ["error", "never"],
    "@stylistic/block-spacing": ["error", "always"],
    "@stylistic/comma-spacing": ["error", { after: true, before: false }],
    "@stylistic/comma-style": ["error", "last"],
    "@stylistic/key-spacing": ["error", { afterColon: true, beforeColon: false }],
    "@stylistic/keyword-spacing": ["error", { after: true, before: true }],
    "@stylistic/object-curly-newline": "error",
    "@stylistic/object-curly-spacing": ["error", "always"],
    "@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
    "@stylistic/space-in-parens": ["error", "never"],
    "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
    "@stylistic/quote-props": ["error", "consistent-as-needed"],
    "@stylistic/arrow-parens": ["error", "as-needed", { requireForBlockBody: true }],
    "@stylistic/function-call-spacing": ["error", "never"],
    "@stylistic/space-infix-ops": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-import-type-side-effects": "error"
  }
});
