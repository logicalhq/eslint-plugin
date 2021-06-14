module.exports = {
  rootDir: '..',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  resetModules: false,
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest'
  },
  moduleNameMapper: {
    '^lib(.*)$': '<rootDir>/lib/$1',
    '^test(.*)$': '<rootDir>/test/$1'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  reporters: ['default']
};
