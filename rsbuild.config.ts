import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { container } from '@rspack/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

const { ModuleFederationPlugin } = container;

const sharedDependencies = {
  react: { singleton: true, requiredVersion: pkg.dependencies.react },
  'react-dom': { singleton: true, requiredVersion: pkg.dependencies['react-dom'] },
};

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
      plugins: [
        new ModuleFederationPlugin({
          name: 'crm',
          filename: 'remoteEntry.js',
          exposes: {},
          remotes: {},
          shared: sharedDependencies,
        }),
      ],
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
  },
});
