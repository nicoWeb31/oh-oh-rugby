const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/back-oh-rugby'),
    clean: true,
    // The default Nx Node template only ever runs `node main.js` directly,
    // so it never wires the bundle's exports to the real module.exports.
    // The Lambda runtime instead *requires* this file to read `.handler` off
    // it, which needs a real CommonJS library export.
    library: { type: 'commonjs2' },
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
