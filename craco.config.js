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
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
          },

          {
            test: /\.(png|jpe?g|gif|woff2?|eot|ttf)$/i,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 8 * 1024,
              },
            },
            generator: {
              filename: 'assets/[name][hash][ext][query]',
            },
          },
          {
            test: /\.svg$/i,
            type: 'asset/resource',
            generator: {
              filename: 'assets/[name][hash][ext][query]',
            },
          },
          {
            test: /\.(scss|css)$/i,
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
