import { copyFile } from 'fs/promises';
import * as path from 'path';

import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const mode = process.env.NODE_ENV || 'production';
const isDev = mode === 'development';
const { publicVars } = loadEnv({ mode, prefixes: ['REACT_APP_'] });

const duplicateSpaFallback = () => ({
  name: 'duplicate-s3-spa-fallback',
  apply: 'build' as const,
  setup(api: {
    context: { distPath: string };
    onAfterBuild: (callback: () => Promise<void>) => void;
  }) {
    api.onAfterBuild(async () => {
      const indexHtmlPath = path.join(api.context.distPath, 'index.html');
      const spaFallbackPath = path.join(api.context.distPath, '404.html');

      await copyFile(indexHtmlPath, spaFallbackPath);
    });
  },
});

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
    duplicateSpaFallback(),
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
