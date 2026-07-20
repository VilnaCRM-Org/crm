import * as fs from 'fs';
import * as path from 'path';

import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const mode = process.env.NODE_ENV || 'production';
const isDev = mode === 'development';
const isAnalyze = process.env.ANALYZE === 'true';
const { publicVars } = loadEnv({ mode, prefixes: ['REACT_APP_'] });

const performanceBudget = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'config/performance-budget.json'), 'utf8')
) as { raw: { maxInitialEntrypointBytes: number; maxAssetBytes: number } };

const isScriptOrStyleAsset = (assetFilename: string): boolean =>
  /\.(?:js|css)$/.test(assetFilename);

const bundleAnalyze = isAnalyze
  ? {
      analyzerMode: 'static' as const,
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }
  : undefined;

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
    },
    bundleAnalyze,
  },
  output: {
    inlineStyles: !isDev,
    filename: {
      font: '[name].[contenthash][ext]',
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
          '@auth': path.resolve(__dirname, 'src/modules/user/features/auth'),
        },
      },
      experiments: {
        nativeWatcher: true,
      },
      performance: {
        hints: isDev ? false : 'error',
        maxEntrypointSize: performanceBudget.raw.maxInitialEntrypointBytes,
        maxAssetSize: performanceBudget.raw.maxAssetBytes,
        assetFilter: isScriptOrStyleAsset,
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
    define: {
      ...publicVars,
    },
  },
});
