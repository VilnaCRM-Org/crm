const path = require('path');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();

  if (process.env.SKIP_LOCALE_GEN !== '1') {
    try {
      localizationGenerator.generateLocalizationFile();
    } catch (err) {
      throw new Error(`Localization generation failed: ${err?.message || err}`);
    }
  }

  return {
    webpack: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      module: {
        rules: [
          {
            test: /\.svg$/i,
            oneOf: [
              {
                issuer: /\.[jt]sx?$/,
                resourceQuery: { not: [/url/] },
                use: ['@svgr/webpack'],
              },
              {
                type: 'asset/resource',
                generator: {
                  filename: 'assets/[name].[contenthash:8][ext][query]',
                },
              },
            ],
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
              filename: 'assets/[name].[contenthash:8][ext][query]',
            },
          },
        ],
      },
    },

    style: {
      sass: {
        loaderOptions: {
          // additionalData: `@use "@/styles/variables" as *;`
        },
      },
    },

    eslint: {
      enable: true,
      mode: 'file',
    },
  };
};
