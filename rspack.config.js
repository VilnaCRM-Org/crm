const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const { defineConfig } = require('@rspack/cli');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const HtmlRspackPlugin = require('html-rspack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LocalizationGenerator = require('./scripts/localizationGenerator');

const mode = process.env.NODE_ENV || 'development';
const isDev = mode === 'development';
const appDir = __dirname;
const srcDir = path.resolve(appDir, 'src');
const publicDir = path.resolve(appDir, 'public');

const skipLocaleGen = /^(1|true|yes|on|enabled)$/i.test(process.env.SKIP_LOCALE_GEN || '');
if (!skipLocaleGen && mode !== 'test') {
  const generator = new LocalizationGenerator();
  generator.generateLocalizationFile();
}

const envFiles = [
  `.env.${mode}.local`,
  `.env.${mode}`,
  mode !== 'test' && `.env.local`,
  `.env`,
]
  .filter(Boolean)
  .map((file) => path.resolve(appDir, file));

const collectedEnv = envFiles.reduce((acc, file) => {
  if (fs.existsSync(file)) {
    const parsed = dotenv.config({ path: file });
    dotenvExpand.expand(parsed);
    if (parsed.parsed) {
      Object.assign(acc, parsed.parsed);
    }
  }
  return acc;
}, {});

const mergedEnv = {
  ...collectedEnv,
  ...process.env,
  NODE_ENV: mode,
};

const clientEnv = Object.keys(mergedEnv)
  .filter((key) => key === 'NODE_ENV' || key === 'PUBLIC_URL' || key.startsWith('REACT_APP_'))
  .reduce(
    (acc, key) => ({
      ...acc,
      [`process.env.${key}`]: JSON.stringify(mergedEnv[key]),
    }),
    {}
  );

module.exports = defineConfig({
  mode,
  target: 'web',
  entry: path.resolve(srcDir, 'index.tsx'),
  output: {
    path: path.resolve(appDir, 'build'),
    filename: isDev ? 'static/js/[name].js' : 'static/js/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': srcDir,
    },
  },
  devtool: isDev ? 'cheap-module-source-map' : 'source-map',
  devServer: {
    port: Number(process.env.DEV_PORT) || 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    hot: true,
    allowedHosts: 'all',
    static: {
      directory: publicDir,
      watch: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true, decorators: true },
            transform: {
              react: { runtime: 'automatic' },
              legacyDecorator: true,
              decoratorMetadata: true,
            },
            externalHelpers: true,
          },
        },
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        oneOf: [
          {
            resourceQuery: /component/,
            use: [
              {
                loader: '@svgr/webpack',
                options: { icon: true, exportType: 'named' },
              },
            ],
          },
          {
            type: 'asset',
            parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
            generator: { filename: 'assets/images/[name].[contenthash:8][ext][query]' },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        generator: { filename: 'assets/images/[name].[contenthash:8][ext][query]' },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/fonts/[name].[contenthash:8][ext][query]' },
      },
      {
        test: /\.module\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isDev ? '[path][name]__[local]' : '[hash:base64:6]',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.module\.s[ac]ss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isDev ? '[path][name]__[local]' : '[hash:base64:6]',
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        exclude: /\.module\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  builtins: {
    define: clientEnv,
    react: {
      runtime: 'automatic',
      refresh: isDev,
    },
    css: {
      modules: {
        auto: /\.module\.(css|s[ac]ss)$/i,
      },
    },
  },
  plugins: [
    isDev && new ReactRefreshPlugin(),
    new HtmlRspackPlugin({
      template: path.resolve(publicDir, 'index.html'),
      filename: 'index.html',
    }),
  ].filter(Boolean),
});
