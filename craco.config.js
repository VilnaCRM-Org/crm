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
          (p) =>
            p && (p instanceof TsconfigPathsPlugin || p.constructor?.name === 'TsconfigPathsPlugin')
        );

        if (!hasTsPaths) {
          const exts = Array.isArray(config.resolve.extensions)
            ? config.resolve.extensions
            : ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
          config.resolve.plugins.push(
            new TsconfigPathsPlugin({
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              extensions: exts,
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

        const hasRule = (rules, test) =>
          rules.some((r) => {
            let tests = [];

            if (Array.isArray(r.test)) {
              tests = r.test;
            } else if (r.test instanceof RegExp) {
              tests = [r.test];
            }

            return tests.some((t) => regEq(t, test));
          });

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
      loaderOptions: (options) => {
        const plugins = Array.isArray(options.plugins) ? options.plugins : [];
        const rest = plugins.filter((p) => {
          const name = Array.isArray(p) ? p[0] : p;
          return (
            name !== '@babel/plugin-proposal-decorators' &&
            name !== 'babel-plugin-transform-typescript-metadata'
          );
        });

        return {
          ...options,
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            'babel-plugin-transform-typescript-metadata',
            ...rest,
          ],
        };
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
