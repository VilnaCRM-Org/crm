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
            use: ['@svgr/webpack', 'url-loader'],
          },
          {
            test: /\.(png|woff|woff2|eot|ttf|svg)$/,
            loader: 'url-loader',
          },
          {
            test: /\.(scss|css)$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
          }
        ],
      },
    },
    eslint: {
      // enable: false,
      extends: path.resolve(__dirname, '.eslintrc.js'),
    },
  };
};
