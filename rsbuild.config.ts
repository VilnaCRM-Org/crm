import * as fs from 'fs';
import * as path from 'path';

import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const mode = process.env.NODE_ENV || 'production';
const isDev = mode === 'development';
const isAnalyze = process.env.ANALYZE === 'true';
const { publicVars } = loadEnv({ mode, prefixes: ['REACT_APP_'] });

const performanceBudget = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'config/performance-budget.json'), 'utf8')
) as { raw?: { maxInitialEntrypointBytes?: number; maxAssetBytes?: number } };

// Fail fast instead of silently falling back to Rspack's 500000-byte default: an absent or
// malformed budget would leave the build gate weaker than the documented limit (issue #117).
const requireBudget = (value: unknown, key: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(
      `config/performance-budget.json: "${key}" must be a positive number, got ${String(value)}. ` +
        'Refusing to build with an unenforced size budget.'
    );
  }
  return value;
};

const browserSupport = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'config/browser-support.json'), 'utf8')
) as { polyfill?: unknown };

// The allowed modes are read from the policy's own schema rather than repeated here, so the
// build, the schema, and `scripts/ci/browser-support.ts` cannot drift apart.
const browserSupportSchema = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'config/browser-support.schema.json'), 'utf8')
) as { properties?: { polyfill?: { enum?: unknown } } };

const polyfillModes = browserSupportSchema.properties?.polyfill?.enum;

// The declared browser matrix and the polyfill decision are one choice (issue #153): an absent
// or unknown mode would silently fall back to RSBuild's default and break the promise the
// README publishes. `make check-browser-support` reconciles both against the same policy file.
const requirePolyfillMode = (value: unknown): 'off' | 'usage' | 'entry' => {
  if (!Array.isArray(polyfillModes) || polyfillModes.length === 0) {
    throw new Error(
      'config/browser-support.schema.json: "properties.polyfill.enum" must list the allowed ' +
        'modes. Refusing to build without a validated polyfill decision.'
    );
  }
  if (!polyfillModes.includes(value)) {
    throw new Error(
      `config/browser-support.json: "polyfill" must be one of ${polyfillModes.join(', ')}, got ` +
        `${String(value)}. Refusing to build against an undeclared browser matrix.`
    );
  }
  return value as 'off' | 'usage' | 'entry';
};

const browserSupportPolyfill = requirePolyfillMode(browserSupport.polyfill);

const maxEntrypointSize = requireBudget(
  performanceBudget.raw?.maxInitialEntrypointBytes,
  'raw.maxInitialEntrypointBytes'
);
const maxAssetSize = requireBudget(performanceBudget.raw?.maxAssetBytes, 'raw.maxAssetBytes');

const isScriptOrStyleAsset = (assetFilename: string): boolean =>
  /\.(?:js|css)$/.test(assetFilename);

const analyzerPlugins = isAnalyze
  ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      }),
    ]
  : [];

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
  server: {
    host: '0.0.0.0',
  },
  dev: {
    lazyCompilation: true,
  },
  splitChunks: {
    preset: 'default',
  },
  performance: {
    buildCache: true,
    printFileSize: true,
    removeConsole: !isDev,
  },
  output: {
    inlineStyles: !isDev,
    polyfill: browserSupportPolyfill,
    filename: {
      font: '[name].[contenthash][ext]',
    },
    sourceMap: {
      js: isDev ? 'cheap-module-source-map' : 'hidden-source-map',
      css: isDev,
    },
  },
  tools: {
    rspack: {
      plugins: analyzerPlugins,
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
        maxEntrypointSize,
        maxAssetSize,
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
