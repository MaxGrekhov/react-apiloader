import path from 'path';

import { defineConfig } from '@rspack/cli';
import ESLintPlugin from 'eslint-rspack-plugin';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  mode: isDev ? 'development' : 'production',
  entry: {
    index: ['./src/index.tsx'],
  },
  stats: {
    builtAt: true,
    modules: false,
  },
  target: ['web', 'es2020'],
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(import.meta.dirname, './lib'),
    module: true,
    library: {
      type: 'module',
    },
  },
  module: {
    rules: [
      {
        test: /\.(m?j|t)sx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ESLintPlugin({
      files: './src',
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      fix: true,
      configType: 'flat',
    }),
  ],
  externals: {
    react: 'react',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  devtool: isDev ? 'eval-source-map' : false,
  performance: {
    maxEntrypointSize: Math.pow(10, 6), // 1 MB
    maxAssetSize: Math.pow(10, 6), // 1 MB
  },
});

