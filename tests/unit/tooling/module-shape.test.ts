// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

import moduleShape from '../../../config/module-shape.json';
import { FEATURE_FILES, MODULE_FILES, featurePaths, modulePaths } from '../../../plopfile';

interface ForbiddenRule {
  name: string;
  severity: string;
  comment: string;
  from: { path?: string };
}

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const depcruise = require('../../../.dependency-cruiser.js') as { forbidden: ForbiddenRule[] };

const ruleFor = (name: string): ForbiddenRule => {
  const rule = depcruise.forbidden.find((candidate) => candidate.name === name);
  if (!rule) {
    throw new Error(`dependency-cruiser rule "${name}" is missing`);
  }
  return rule;
};

const disallowed = (folders: readonly string[]): string => `(?!(?:${folders.join('|')})/)[^/]+/`;

const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const MODULE = 'catalog';
const FEATURE = 'catalog-list';

const folderSegments = (paths: string[], prefix: string): string[] =>
  paths
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => entry.slice(prefix.length).split('/')[0])
    .filter(
      (segment): segment is string => segment !== undefined && segment.includes('.') === false
    );

describe('config/module-shape.json is the single source of the folder law (issue #108)', () => {
  it.each([
    [
      'module-allowed-folders',
      `^src/modules/[^/]+/${disallowed(moduleShape.module.allowedFolders)}`,
    ],
    [
      'feature-allowed-folders',
      `^src/modules/[^/]+/features/[^/]+/${disallowed(moduleShape.feature.allowedFolders)}`,
    ],
    [
      'tests-top-level-allowed-folders',
      `^tests/${disallowed(moduleShape.tests.rootAllowedFolders)}`,
    ],
    [
      'tests-module-allowed-folders',
      `^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/${disallowed(
        moduleShape.tests.moduleAllowedFolders
      )}`,
    ],
    [
      'tests-feature-allowed-folders',
      `^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/features/[a-z0-9-]+/${disallowed(
        moduleShape.tests.featureAllowedFolders
      )}`,
    ],
  ])('%s is built from the shared policy, not a second hardcoded list', (name, expected) => {
    const rule = ruleFor(name);

    expect(rule.severity).toBe('error');
    expect(rule.from.path).toBe(expected);
  });

  it('names every allowed folder in the rule comment so violations are self-explaining', () => {
    expect(ruleFor('module-allowed-folders').comment).toContain(
      moduleShape.module.allowedFolders.join(', ')
    );
    expect(ruleFor('feature-allowed-folders').comment).toContain(
      moduleShape.feature.allowedFolders.join(', ')
    );
  });

  it('keeps .dependency-cruiser.js free of a second copy of the folder lists', () => {
    const source = readText('.dependency-cruiser.js');

    expect(source).toContain("require('./config/module-shape.json')");
    expect(source).not.toContain('config|features|hooks|lib|store|types|utils');
    expect(source).not.toContain('assets|components|hooks|i18n|repositories');
  });
});

describe('the generator emits only policy-allowed folders (issue #108)', () => {
  it('creates exactly the module folders module.allowedFolders declares', () => {
    const emitted = [
      ...modulePaths(moduleShape, MODULE, FEATURE),
      ...featurePaths(moduleShape, MODULE, FEATURE),
    ];
    const created = folderSegments(emitted, `src/modules/${MODULE}/`);

    expect(created.length).toBeGreaterThan(0);
    expect(new Set(created)).toEqual(new Set(moduleShape.module.allowedFolders));
  });

  it('creates exactly the feature folders feature.allowedFolders declares', () => {
    const prefix = `src/modules/${MODULE}/features/${FEATURE}/`;
    const created = folderSegments(featurePaths(moduleShape, MODULE, FEATURE), prefix);

    expect(created.length).toBeGreaterThan(0);
    expect(new Set(created)).toEqual(new Set(moduleShape.feature.allowedFolders));
  });

  it('mirrors the generated tests into test folders the tests-* rules allow', () => {
    const paths = featurePaths(moduleShape, MODULE, FEATURE);
    const testRoots = ['tests/unit', 'tests/e2e'];

    testRoots.forEach((root) => {
      const owned = paths.filter((entry) => entry.startsWith(`${root}/modules/${MODULE}/`));
      expect(owned.length).toBeGreaterThan(0);
      owned.forEach((entry) => {
        const [moduleFolder] = entry.slice(`${root}/modules/${MODULE}/`.length).split('/');
        expect(moduleShape.tests.moduleAllowedFolders).toContain(moduleFolder);
      });
    });

    const featurePrefix = `tests/unit/modules/${MODULE}/features/${FEATURE}/`;
    const featureFolders = folderSegments(paths, featurePrefix);

    expect(featureFolders.length).toBeGreaterThan(0);
    featureFolders.forEach((folder) => {
      expect(moduleShape.tests.featureAllowedFolders).toContain(folder);
    });
  });

  it('ships every template the generators reference', () => {
    [...MODULE_FILES, ...FEATURE_FILES].forEach((file) => {
      expect(fs.existsSync(path.join(repoRoot, 'scripts', 'templates', file.template))).toBe(true);
    });
  });

  it('emits both required locales for every generated feature', () => {
    const paths = featurePaths(moduleShape, MODULE, FEATURE);

    moduleShape.locales.forEach((locale) => {
      expect(paths).toContain(`src/modules/${MODULE}/features/${FEATURE}/i18n/${locale}.json`);
    });
  });

  it('accepts only kebab-case module and feature names', () => {
    const pattern = new RegExp(moduleShape.namePattern);

    expect(pattern.test('order-list')).toBe(true);
    expect(pattern.test('orders')).toBe(true);
    expect(pattern.test('Orders')).toBe(false);
    expect(pattern.test('order_list')).toBe(false);
    expect(pattern.test('-orders')).toBe(false);
    expect(pattern.test('orders-')).toBe(false);
  });

  it('only accepts names the dependency-cruiser kebab-case rules also accept', () => {
    const pattern = new RegExp(moduleShape.namePattern);
    const moduleRule = new RegExp(ruleFor('src-module-name-kebab-case').from.path ?? '');

    ['orders', 'order-list', 'crm-import', 'a1-b2'].forEach((name) => {
      expect(pattern.test(name)).toBe(true);
      expect(moduleRule.test(`src/modules/${name}/config/di.ts`)).toBe(false);
    });

    // Prove the gate rule actually rejects something, so the assertions above cannot pass
    // against a rule that matches nothing at all.
    expect(moduleRule.test('src/modules/Orders/config/di.ts')).toBe(true);
    expect(moduleRule.test('src/modules/order_list/config/di.ts')).toBe(true);
  });
});
