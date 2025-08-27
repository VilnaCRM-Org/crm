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
    ];
    cfg.resolve.plugins = [
      ...(cfg.resolve.plugins || []),
      new TsconfigPathsPlugin({
        extensions: cfg.resolve.extensions,
        configFile: 'tsconfig.paths.json',
      }),
    ];
    cfg.module = cfg.module || {};
    cfg.module.rules = [
      ...(cfg.module.rules || []),
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
    ];
    return cfg;
  },
};

export default config;
