const path = require('path');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();

  if (process.env.SKIP_LOCALE_GEN !== '1') {
    try {
      localizationGenerator.generateLocalizationFile();
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error(`Localization generation failed: ${String(err)}`);
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
                use: [
                  {
                    loader: '@svgr/webpack',
                    options: {
                      typescript: true,
                      icon: true,
                      memo: true,
                      ref: true,
                      svgo: true,
                      svgoConfig: {
                        plugins: [
                          {
                            name: 'preset-default',
                            params: { overrides: { removeViewBox: false } },
                          },
                          { name: 'removeDimensions', active: true },
                        ],
                      },
                    },
                  },
                ],
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
            test: /\.(png|jpe?g|gif|webp|avif|bmp|ico|woff2?|eot|ttf)$/i,
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
