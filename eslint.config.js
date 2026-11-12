import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules", "site/public/data", "data", "docsReplicate"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-console": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": "allow-with-description", minimumDescriptionLength: 10 },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
