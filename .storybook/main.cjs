const path = require('node:path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config, { configType }) => {
    const isProd = configType === 'PRODUCTION';

    config.resolve = config.resolve || {};
    config.resolve.extensions = config.resolve.extensions || [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.json',
    ];
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        extensions: config.resolve.extensions,
        configFile: path.resolve(process.cwd(), 'tsconfig.paths.json'),
      }),
    ];
    const sanitizeSvgInRules = (rules) =>
      (rules || []).map((rule) => {
        if (!rule || typeof rule !== 'object') return rule;
        if (Array.isArray(rule.oneOf)) return { ...rule, oneOf: sanitizeSvgInRules(rule.oneOf) };
        const test = rule.test;
        const hasSvg =
          test instanceof RegExp
            ? /svg/.test(test.source)
            : Array.isArray(test)
              ? test.some((t) => t instanceof RegExp && /svg/.test(t.source))
              : typeof test === 'string'
                ? test.includes('svg')
                : false;
        if (hasSvg) {
          const prev = rule.exclude
            ? Array.isArray(rule.exclude)
              ? rule.exclude
              : [rule.exclude]
            : [];
          return { ...rule, exclude: [...prev, /\.svg$/i] };
        }
        return rule;
      });

    const existingRules = config.module.rules || [];
    const sanitizedRules = sanitizeSvgInRules(existingRules);

    config.module.rules = [
      {
        test: /\.svg$/i,
        oneOf: [
          {
            issuer: /\.(?:mdx|[jt]sx?)$/,
            resourceQuery: { not: [/url/] },
            use: [
              {
                loader: '@svgr/webpack',
                options: {
                  svgo: true,
                  svgoConfig: {
                    plugins: [
                      { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
                      'removeDimensions',
                    ],
                  },
                  titleProp: true,
                  ref: true,
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

      ...sanitizedRules,

      {
        test: /\.module\.s[ac]ss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isProd ? '[hash:base64:5]' : '[name]__[local]__[hash:base64:5]',
              },
            },
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: !isProd },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        exclude: /\.module\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          { loader: 'sass-loader', options: { sourceMap: !isProd } },
        ],
        sideEffects: true,
      },
    ];

    return config;
  },
};
