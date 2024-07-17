import { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/v*/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text-summary'],
  setupFiles: ['dotenv/config'],
  maxWorkers: '50%',
  modulePathIgnorePatterns: ['/.build'],
  testPathIgnorePatterns: ['/node_modules/', '/.build', '/out'],
  setupFilesAfterEnv: ['<rootDir>/testing/jest.setup.ts'],
};

export default config;
