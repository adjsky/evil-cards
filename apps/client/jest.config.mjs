const tsConfigFile = "./tsconfig.jest.json"

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.mjs"],
  testEnvironment: "jsdom",
  rootDir: "./",
  transform: {
    "^.+\\.m?[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: tsConfigFile
      }
    ]
  },
  moduleNameMapper: {
    "\\.svg$": "<rootDir>/test/config/svgr-mock.tsx",
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.css$": "identity-obj-proxy"
  }
}

export default config
