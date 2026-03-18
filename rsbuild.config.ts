import * as path from 'path';

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
      forceSplitting: {
        'vendors-mui': /node_modules\/@mui|node_modules\/@emotion/,
        'vendors-redux': /node_modules\/@reduxjs|node_modules\/redux|node_modules\/immer|node_modules\/reselect|node_modules\/react-redux/,
        'vendors-i18n': /node_modules\/i18next|node_modules\/react-i18next/,
      },
    },
  },
  output: {
    inlineStyles: !isDev,
    filename: {
      font: '[name][ext]',
    },
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
