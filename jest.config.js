module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/scripts/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!app/_layout.tsx',
  ],
};
