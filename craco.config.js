const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  const skipLocaleGen = /^(1|true|yes|on|enabled)$/i.test(process.env.SKIP_LOCALE_GEN || '');

  if (!skipLocaleGen && process.env.NODE_ENV !== 'test') {
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

      configure: (webpackConfig) => {
        const config = {
          ...webpackConfig,
          resolve: { ...(webpackConfig.resolve || {}) },
          module: { ...(webpackConfig.module || {}) },
        };

        config.resolve.plugins = [...(config.resolve.plugins || [])];
        const hasTsPaths = (config.resolve.plugins || []).some(
          (p) => p && p.constructor && p.constructor.name === 'TsconfigPathsPlugin'
        );
        if (!hasTsPaths) {
          config.resolve.plugins.push(
            new TsconfigPathsPlugin({
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              extensions: config.resolve.extensions,
            })
          );
        }

        const imagesRule = {
          test: /\.(png|jpe?g|gif|webp|avif|bmp)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          generator: { filename: 'assets/images/[name].[contenthash:8][ext][query]' },
        };

        const fontsRule = {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/fonts/[name].[contenthash:8][ext][query]' },
        };

        const faviconRule = {
          test: /favicon\.ico$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name].[contenthash:8][ext][query]' },
        };

        const rulesContainer = config.module.rules?.find((r) => Array.isArray(r.oneOf));
        const targetRules = rulesContainer ? rulesContainer.oneOf : (config.module.rules ||= []);

        const regEq = (a, b) =>
          a instanceof RegExp &&
          b instanceof RegExp &&
          a.source === b.source &&
          a.flags === b.flags;

        const hasRule = (rules, test) => rules.some((r) => r.test && regEq(r.test, test));

        if (!hasRule(targetRules, imagesRule.test)) targetRules.unshift(imagesRule);
        if (!hasRule(targetRules, fontsRule.test)) targetRules.unshift(fontsRule);
        if (!hasRule(targetRules, faviconRule.test)) targetRules.unshift(faviconRule);

        if (!rulesContainer) {
          config.module.rules = targetRules;
        }
        return config;
      },
    },

    babel: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        'babel-plugin-transform-typescript-metadata',
      ],
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
