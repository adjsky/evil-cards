/** @type {import("prettier").Config} */
module.exports = {
  tabWidth: 2,
  useTabs: false,
  semi: false,
  trailingComma: "none",
  singleQuote: false,
  plugins: [require.resolve("prettier-plugin-tailwindcss")]
}
