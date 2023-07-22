module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    es2021: true,
    node: true
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "warn",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-non-null-assertion": "off"
  }
}
