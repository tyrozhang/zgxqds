module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['e2e'],
  collectCoverageFrom: ['utils/**/*.js']
};
