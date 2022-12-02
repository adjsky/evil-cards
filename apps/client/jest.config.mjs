import nextJest from "next/jest"

const createJestConfig = nextJest({
  dir: "./"
})

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom"
}

export default createJestConfig(customJestConfig)
