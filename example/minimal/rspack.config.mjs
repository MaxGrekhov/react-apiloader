import path from 'path';

import { defineConfig } from '@rspack/cli';
import { HtmlRspackPlugin } from '@rspack/core';
import ESLintPlugin from 'eslint-rspack-plugin';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  mode: isDev ? 'development' : 'production',
  entry: {
    app: ['./index.tsx'],
  },
  devServer: {
    port: 8080,
  },
  stats: {
    builtAt: true,
    modules: false,
    timings: true,
  },
  target: ['web', 'es2020'],
  output: {
    publicPath: '/',
    filename: '[name].js?[contenthash]',
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
    new HtmlRspackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.png',
      minify: false,
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      'react-apiloader': path.resolve(import.meta.dirname, '../../src/index.tsx'),
      'react': path.resolve(import.meta.dirname, 'node_modules/react'),
    },
  },
  devtool: isDev ? 'eval-source-map' : false,
  performance: {
    maxEntrypointSize: Math.pow(10, 6), // 1 MB
    maxAssetSize: Math.pow(10, 6), // 1 MB
  },
});

