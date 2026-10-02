module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: {
    'catalog\\.generated\\.json$': '<rootDir>/tests/fixtures/catalog.json',
    '\\.(docx|rtf|mp4|pdf|txt)$': '<rootDir>/tests/asset-mock.cjs',
  },
};
