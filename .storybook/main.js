import path from 'node:path';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (cfg) => {
    cfg.resolve = cfg.resolve || {};
    cfg.resolve.extensions = cfg.resolve.extensions || [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.json',
    ];
    cfg.resolve.plugins = [
      ...(cfg.resolve.plugins || []),
      new TsconfigPathsPlugin({
        extensions: cfg.resolve.extensions,
        configFile: path.resolve(process.cwd(), 'tsconfig.paths.json'),
      }),
      ,
    ];

    cfg.module = cfg.module || {};
    const existingRules = cfg.module.rules || [];

    const sanitizedRules = existingRules.map((rule) =>
      rule?.test && rule.test.toString().includes('svg') ? { ...rule, exclude: /\.svg$/i } : rule
    );

    cfg.module.rules = [
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
            generator: { filename: 'assets/[name].[contenthash:8][ext][query]' },
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
            options: { modules: { localIdentName: '[name]__[local]__[hash:base64:5]' } },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        exclude: /\.module\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ];

    return cfg;
  },
};

export default config;
