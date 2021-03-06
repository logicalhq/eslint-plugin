module.exports = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  resetModules: true,
  clearMocks: true,
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest'
  },
  moduleNameMapper: {
    '^lib(.*)$': '<rootDir>/lib/$1',
    '^test(.*)$': '<rootDir>/test/$1'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['<rootDir>/{test/utils,lib}/**/*.spec.ts'],
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/{test/utils,lib}/**/*.ts'],
  coveragePathIgnorePatterns: ['index.ts', '.rule.ts'],
  // @fix-me A regression in Jest reports weird coverage results, commenting this for now.
  // coverageThreshold: {
  //   global: {
  //     branches: 100,
  //     functions: 100,
  //     lines: 100,
  //     statements: 100
  //   }
  // },
  reporters: ['default']
};
