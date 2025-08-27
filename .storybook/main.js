import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

export const stories = ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'];
export const addons = [
  '@storybook/addon-links',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
];
export const framework = '@storybook/react';
export const core = {
  builder: '@storybook/builder-webpack5',
};
export async function webpackFinal(config) {
  config.resolve.plugins = [
    ...(config.resolve.plugins || []),
    new TsconfigPathsPlugin({
      extensions: config.resolve.extensions,
    }),
  ];
  return config;
}
