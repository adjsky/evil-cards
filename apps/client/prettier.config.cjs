const config = require("@evil-cards/prettier-config")

module.exports = {
  ...config,
  plugins: [require.resolve("prettier-plugin-tailwindcss")]
}
