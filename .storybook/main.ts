import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-webpack5';

const resolvePackage = (specifier: string): string => fileURLToPath(import.meta.resolve(specifier));

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: { check: false },
  env: (config) => ({
    ...config,
    REACT_APP_MAIN_LANGUAGE: process.env.REACT_APP_MAIN_LANGUAGE ?? 'uk',
    REACT_APP_FALLBACK_LANGUAGE: process.env.REACT_APP_FALLBACK_LANGUAGE ?? 'en',
  }),
  webpackFinal: async (config) => {
    config.module?.rules?.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: resolvePackage('babel-loader'),
          options: {
            presets: [
              resolvePackage('@babel/preset-env'),
              [resolvePackage('@babel/preset-react'), { runtime: 'automatic' }],
              resolvePackage('@babel/preset-typescript'),
            ],
          },
        },
      ],
    });

    config.resolve = config.resolve || {};
    config.resolve.extensions = Array.from(
      new Set([...(config.resolve.extensions || []), '.ts', '.tsx'])
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(import.meta.dirname, '../src'),
    };

    return config;
  },
  docs: {},
};

export default config;
