import * as path from 'path';

import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const mode = process.env.NODE_ENV || 'production';
const isDev = mode === 'development';
const { publicVars } = loadEnv({ mode, prefixes: ['REACT_APP_'] });

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSvgr({
      mixedImport: true,
      svgrOptions: {
        exportType: 'named',
        namedExport: 'ReactComponent',
        ref: true,
        svgo: true,
      },
    }),
    pluginModuleFederation({
      name: 'crm',
      remotes: {},
      exposes: {},
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        '@apollo/client': { singleton: true, eager: true, requiredVersion: '^3.0.0' },
        graphql: { singleton: true, eager: true, requiredVersion: '^16.0.0' },
      },
    }),
  ],
  html: {
    template: './public/index.html',
  },
  dev: {
    lazyCompilation: true,
  },
  performance: {
    buildCache: true,
    printFileSize: true,
    removeConsole: !isDev,
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
  output: {
    sourceMap: {
      js: isDev ? 'cheap-module-source-map' : false,
      css: isDev,
    },
  },
  tools: {
    rspack: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
      experiments: {
        nativeWatcher: true,
      },
    },
    swc: {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          useDefineForClassFields: false,
        },
      },
    },
  },
  source: {
    decorators: { version: 'legacy' },
    define: publicVars,
  },
});
