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
        svgo: false,
      },
    }),
    pluginModuleFederation({
      name: 'crm',
      remotes: {},
      exposes: {},
      shared: {
        react: { singleton: true, eager: true, requiredVersion: false },
        'react-dom': { singleton: true, eager: true, requiredVersion: false },
      },
    }),
  ],
  html: {
    template: './public/index.html',
  },
  performance: {
    buildCache: true,
    printFileSize: true,
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        vendors: /[/]node_modules[/](react|react-dom|@mui|redux|tsyringe)[/]/,
      },
    },
  },
  output: {
    sourceMap: {
      js: isDev ? 'cheap-module-source-map' : false,
      css: isDev,
    },
    legalComments: 'none',
    filenameHash: true,
  },
  tools: {
    rspack: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
      experiments: {
        lazyCompilation: true,
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
