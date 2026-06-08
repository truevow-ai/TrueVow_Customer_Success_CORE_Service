/** @type {import('jest').Config} */

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@babel)/)',
  ],
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/libs/core/$1',
    '^@/types/(.*)$': '<rootDir>/libs/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/libs/hooks/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/tests/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  roots: ['<rootDir>'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'tests/security/auth-bypass.test.ts',
    'tests/integration/edge-cases.test.ts',
  ],
  collectCoverageFrom: [
    'libs/core/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 10000,
}

module.exports = customJestConfig
