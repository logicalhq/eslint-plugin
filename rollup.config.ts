import { resolve } from 'path';
import polyfillPlugin from 'rollup-plugin-polyfill-node';
import sourcemapsPlugin from 'rollup-plugin-sourcemaps';
import typescriptPlugin from 'rollup-plugin-typescript2';
import commonjsPlugin from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';

import pkg from './package.json';

export default {
  input: 'lib/index.ts',
  output: [
    {
      file: resolve(`dist/index.js`),
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    }
  ],
  external: [...Object.keys(pkg.dependencies)],
  watch: {
    include: 'lib/**'
  },
  plugins: [
    jsonPlugin(),
    typescriptPlugin({
      check: true,
      useTsconfigDeclarationDir: true,
      tsconfig: resolve(__dirname, 'tsconfig.build.json'),
      cacheRoot: resolve(__dirname, 'node_modules/.ts-cache')
    }),
    commonjsPlugin(),
    polyfillPlugin(),
    sourcemapsPlugin()
  ],
  treeshake: {
    moduleSideEffects: false
  }
};
