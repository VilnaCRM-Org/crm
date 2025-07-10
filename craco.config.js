const path = require('path');
// const LocalizationGenerator = require('./scripts/localizationGenerator');

// eslint-disable-next-line
module.exports = function () {
  // TODO: need fix localizationGenerator for module approach
  // const localizationGenerator = new LocalizationGenerator();
  // localizationGenerator.generateLocalizationFile();

  return {
    webpack: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      module: {
        rules: [
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
