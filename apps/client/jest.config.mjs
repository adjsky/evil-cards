const tsConfigFile = "./tsconfig.jest.json"

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
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
    "\\.svg$": "<rootDir>/test/config/svgr-mock.tsx"
  }
}

export default config
