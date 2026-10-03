module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.generated.ts',
    '!src/data/architecture/entities.ts',
  ],
  coverageReporters: ['text-summary', 'html', 'json-summary'],
  coverageThreshold: {
    global: { statements: 70, branches: 60, functions: 68, lines: 70 },
  },
  moduleNameMapper: {
    'catalog\\.generated\\.json$': '<rootDir>/tests/fixtures/catalog.json',
    '\\.(docx|rtf|mp4|pdf|txt)$': '<rootDir>/tests/asset-mock.cjs',
  },
};
