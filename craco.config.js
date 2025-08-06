const path = require('path');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  localizationGenerator.generateLocalizationFile();

  return {
    webpack: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      module: {
        rules: [
          {
            test: /\.svg$/,
            use: ['@svgr/webpack'],
          },

          {
            test: /\.svg$/,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
          },
          {
            test: /\.(png|woff|woff2|eot|ttf)$/,
            loader: 'url-loader',
          },
          {
            test: /\.svg$/,
            type: 'asset/resource',
            generator: {
              filename: 'assets/[name][ext]',
            },
          },
          {
            test: /\.(scss|css)$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
          },
        ],
      },
    },
    eslint: {
      extends: path.resolve(__dirname, './eslintrc.js'),
    },
  };
};
