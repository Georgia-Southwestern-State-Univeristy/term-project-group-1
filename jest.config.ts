import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

const jestConfig = createJestConfig(config);

// next/jest appends transformIgnorePatterns, so we override post-resolve
// to allow ESM-only packages (jose) through the Jest transform pipeline.
async function resolvedConfig() {
  const resolved = await jestConfig();
  resolved.transformIgnorePatterns = [
    "/node_modules/(?!.pnpm)(?!(jose|geist)/)",
    "/node_modules/.pnpm/(?!(jose|geist)@)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return resolved;
}

export default resolvedConfig;
