const path = require('path');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  const skipLocaleGen = /^(1|true|yes)$/i.test(process.env.SKIP_LOCALE_GEN || '');

  if (!skipLocaleGen) {
    try {
      localizationGenerator.generateLocalizationFile();
    } catch (err) {
      const message = `Localization generation failed: ${err instanceof Error ? err.message : String(err)}`;
      let error;
      try {
        error = new Error(message, { cause: err });
      } catch {
        error = new Error(message);
        error.cause = err;
      }
      throw error;
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
                      dimensions: false,
                      memo: true,
                      ref: true,
                      svgo: true,
                      svgoConfig: {
                        multipass: true,
                        plugins: [
                          {
                            name: 'preset-default',
                            params: { overrides: { removeViewBox: false } },
                          },
                          { name: 'removeTitle', active: false },
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
            test: /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i,
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
          {
            test: /\.(woff2?|eot|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
              filename: 'assets/fonts/[name].[contenthash:8][ext][query]',
            },
          },
        ],
      },
    },

    style: {
      sass: {
        loaderOptions: {
          sassOptions: { quietDeps: true },
        },
      },
    },

    eslint: {
      enable: true,
      mode: 'file',
    },
  };
};
