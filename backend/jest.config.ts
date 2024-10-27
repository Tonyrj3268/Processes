// jest.config.ts

import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  moduleFileExtensions: ["js", "ts", "json", "node"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
};

export default config;