const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ESLintPlugin = require('eslint-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';
const analyzePlugins = process.env.analyze === 'yes' ? [new BundleAnalyzerPlugin()] : [];

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: {
    index: ['./src/index.tsx'],
  },
  stats: {
    builtAt: true,
    modules: false,
  },
  target: ['web', 'es5'],
  output: {
    path: path.resolve(__dirname, './lib'),
    publicPath: '/',
    filename: '[name].js?[contenthash]',
    library: {
      name: 'apiloader',
      type: 'umd',
    },
  },
  optimization: {
    minimizer: [new TerserJSPlugin()],
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(((j|t)sx?)|(s?css))$/,
        exclude: /node_modules/,
        use: (info) => [
          {
            loader: 'prettier-loader',
            options: JSON.stringify({ filepath: info.realResource, ignoreInitial: true }),
          },
        ],
      },
      {
        test: /\.(m?j|t)sx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new ESLintPlugin(), ...analyzePlugins],
  externals: {
    react: 'react',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  devtool: isDev ? 'eval-source-map' : false,
  performance: {
    maxEntrypointSize: Math.pow(10, 6), // 1 MB
    maxAssetSize: Math.pow(10, 6), // 1 MB
  },
};
