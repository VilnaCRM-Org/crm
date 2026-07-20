// @jest-environment jsdom

import fs from 'fs';
import path from 'path';

import { Fragment, isValidElement } from 'react';
import type { ReactElement } from 'react';

import routeManifest from '@/routes/route-manifest';
import ROUTE_PATHS from '@/routes/route-paths';

const manifestSource = fs.readFileSync(
  path.resolve(__dirname, '../../../src/routes/route-manifest.tsx'),
  'utf8'
);

// Page modules that MUST be code-split (dynamic import), never imported eagerly.
const PAGE_SPECIFIERS = [
  '@/button-example',
  '@auth/routes/sign-up',
  '@auth/routes/sign-in',
  '@/components/not-found/not-found',
];

describe('route manifest (issue #117 machine check)', () => {
  it('is a non-empty list of route definitions', () => {
    expect(Array.isArray(routeManifest)).toBe(true);
    expect(routeManifest.length).toBeGreaterThan(0);
  });

  it('declares every route with a dynamic-import loader and no eager page import', () => {
    routeManifest.forEach((route) => {
      expect(typeof route.load).toBe('function');
      expect(route.load.length).toBe(0);
    });

    const dynamicImports = manifestSource.match(/load:\s*\(\)\s*=>\s*import\(/g) ?? [];
    expect(dynamicImports.length).toBe(routeManifest.length);

    PAGE_SPECIFIERS.forEach((specifier) => {
      const dynamicImport = new RegExp(`import\\([^)]*'${specifier}'`);
      expect(manifestSource).toMatch(dynamicImport);
      // An eager `import X from '<page>'` contains `from '<page>'`; a dynamic import never does.
      expect(manifestSource).not.toContain(`from '${specifier}'`);
    });
  });

  it('declares a non-null Suspense fallback for every route', () => {
    routeManifest.forEach((route) => {
      expect(isValidElement(route.fallback)).toBe(true);
      // An empty fragment passes isValidElement but renders nothing — reject it explicitly.
      expect((route.fallback as ReactElement).type).not.toBe(Fragment);
    });
    expect(manifestSource).not.toMatch(/fallback:\s*(?:null|undefined|false)\b/);
    expect(manifestSource).not.toContain('fallback={null}');
    expect(manifestSource).not.toMatch(/fallback:\s*<>\s*<\/>/);
  });

  it('targets a known path or the index route, with unique ids', () => {
    const knownPaths = new Set<string>(Object.values(ROUTE_PATHS));
    const ids = new Set<string>();
    routeManifest.forEach((route) => {
      expect(ids.has(route.id)).toBe(false);
      ids.add(route.id);
      const isIndex = route.index === true;
      const hasPath = typeof route.path === 'string';
      expect(isIndex !== hasPath).toBe(true);
      if (hasPath) {
        expect(knownPaths.has(route.path as string)).toBe(true);
      }
    });
  });
});
