import path from 'path';

import { defineConfig } from '@rspack/cli';
import { CssExtractRspackPlugin, HtmlRspackPlugin } from '@rspack/core';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import ESLintPlugin from 'eslint-rspack-plugin';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  mode: isDev ? 'development' : 'production',
  entry: {
    app: ['./src/index.tsx'],
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
        options: { transpileOnly: true },
      },
      {
        test: /\.css$/,
        use: [CssExtractRspackPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(ico|png|jpg|gif|eot|ttf|woff|woff2?)$/,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
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
    new CssExtractRspackPlugin({
      filename: '[name].css?[contenthash]',
      chunkFilename: '[id].css?[contenthash]',
      ignoreOrder: true,
    }),
    new HtmlRspackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.png',
      minify: false,
    }),
    new TsCheckerRspackPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
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

