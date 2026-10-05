import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-webpack5';

const resolvePackage = (specifier: string): string => fileURLToPath(import.meta.resolve(specifier));

const SVG_PATTERN = /\.svg$/;

const hasTestProperty = (rule: unknown): rule is { test: unknown } =>
  typeof rule === 'object' && rule !== null && 'test' in rule;

const handlesSvg = (rule: unknown): rule is { test: RegExp } =>
  hasTestProperty(rule) && rule.test instanceof RegExp && rule.test.test('icon.svg');

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
    config.module = config.module || {};
    config.module.rules = (config.module.rules || []).map((rule) =>
      handlesSvg(rule) ? { ...rule, exclude: SVG_PATTERN } : rule
    );

    config.module.rules.push(
      {
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
              plugins: [
                resolvePackage('babel-plugin-transform-typescript-metadata'),
                [resolvePackage('@babel/plugin-proposal-decorators'), { legacy: true }],
              ],
            },
          },
        ],
      },
      {
        test: SVG_PATTERN,
        use: [
          {
            loader: resolvePackage('@svgr/webpack'),
            options: { exportType: 'named', namedExport: 'ReactComponent', ref: true, svgo: true },
          },
          { loader: path.resolve(import.meta.dirname, 'svg-url-loader.cjs') },
        ],
      }
    );

    config.resolve = config.resolve || {};
    config.resolve.extensions = Array.from(
      new Set([...(config.resolve.extensions || []), '.ts', '.tsx'])
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(import.meta.dirname, '../src'),
      '@auth': path.resolve(import.meta.dirname, '../src/modules/user/features/auth'),
      '@stories': import.meta.dirname,
    };

    return config;
  },
  docs: {},
};

export default config;
