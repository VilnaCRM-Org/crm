import * as path from 'path';

import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

const mode = process.env.NODE_ENV || 'production';
const { publicVars } = loadEnv({ mode, prefixes: ['REACT_APP_'] });

export default defineConfig({
  plugins: [
    pluginReact(),
    // Match CRA behavior: default import is URL, named ReactComponent is the component.
    pluginSvgr({
      mixedImport: true,
      svgrOptions: {
        exportType: 'named',
        namedExport: 'ReactComponent',
        ref: true,
        svgo: false,
      },
    }),
  ],
  html: {
    template: './public/index.html',
  },
  tools: {
    rspack: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
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
          // Keep class fields in loose mode for compatibility with legacy decorators.
          useDefineForClassFields: false,
        },
      },
    },
  },
  source: {
    decorators: { version: 'legacy' },
    define: publicVars,
  },
  plugins: [
    pluginModuleFederation({
      name: 'crm',
      remotes: {},
      exposes: {},
      shared: {},
    }),
  ],
});
