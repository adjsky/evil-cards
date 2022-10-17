const config = require("../../prettier.config.cjs")

module.exports = {
  ...config,
  plugins: [require.resolve("prettier-plugin-tailwindcss")]
}
