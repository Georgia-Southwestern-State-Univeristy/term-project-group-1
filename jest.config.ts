import type { Config } from "jest";
import nextJest from "next/jest.js";
import { fileURLToPath } from "url";
import path from "path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/lib/db$": `${ROOT}/lib/__mocks__/db.ts`,
    "^@/lib/repositories/(sessionRepo|policyRepo|transcriptRepo|checklistStateRepo|frequencyRepo|userRepo|seedUsers|revokedTokenRepo)$": `${ROOT}/lib/repositories/__test-impl__/$1`,
    "^@/(.*)$": `${ROOT}/$1`,
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

const jestConfig = createJestConfig(config);

// next/jest appends transformIgnorePatterns and injects SWC path resolution
// from tsconfig.json. We override post-resolve to:
// 1. Allow ESM-only packages (jose) through the transform pipeline
// 2. Clear SWC path aliases so moduleNameMapper handles @/ → __test-impl__
async function resolvedConfig() {
  const resolved = await jestConfig();
  resolved.transformIgnorePatterns = [
    "/node_modules/(?!.pnpm)(?!(jose|geist)/)",
    "/node_modules/.pnpm/(?!(jose|geist)@)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];

  // Remove SWC path resolution so moduleNameMapper intercepts all @/ imports,
  // including transitive ones from service → repo files.
  const transformKey = Object.keys(resolved.transform!).find((k) =>
    k.includes("tsx")
  );
  if (transformKey) {
    const entry = resolved.transform![transformKey];
    if (Array.isArray(entry)) {
      const [transformer, opts] = entry as [string, Record<string, unknown>];
      const jsConfig = opts.jsConfig as
        | { compilerOptions?: Record<string, unknown> }
        | undefined;
      if (jsConfig?.compilerOptions?.paths) {
        delete jsConfig.compilerOptions.paths;
      }
      resolved.transform![transformKey] = [transformer, opts];
    }
  }

  return resolved;
}

export default resolvedConfig;
