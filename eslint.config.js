// eslint.config.js
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";

export default [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      react: eslintPluginReact,
      "jsx-a11y": eslintPluginJsxA11y,
    },
    rules: {
      // منع inline scripts/styles (CSP-friendly)
      "no-inline-comments": "warn",            // تحذير على التعليقات داخل السطر
      "react/no-danger": "warn",               // تحذير على استخدام dangerouslySetInnerHTML
      "react/jsx-no-bind": "warn",             // منع bind وinline functions في JSX
      "react/jsx-no-literals": ["warn", { "noStrings": true }], // منع النصوص inline في JSX
      "jsx-a11y/no-onchange": "warn",          // تحسين الوصولية
      "jsx-a11y/anchor-is-valid": "warn",
    },
  },
];
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@next/next/recommended"
  ],
  plugins: ["react"],
  rules: {
    // قواعد خاصة لو تحب
  },
  settings: {
    react: { version: "detect" }
  }
};

