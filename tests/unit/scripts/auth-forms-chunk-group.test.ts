/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import type { Rspack } from '@rsbuild/core';

import {
  AUTH_FORM_CHUNKS,
  AUTH_FORMS_CHUNK,
  AUTH_FORMS_VENDORS_CHUNK,
  authFormsCacheGroup,
  authFormsVendorsCacheGroup,
  RECOVERY_FORM_CHUNKS,
} from '@scripts/auth-forms-chunk-group';

type ChunkFilter = (chunk: Rspack.Chunk) => boolean;
type ModuleTest = Rspack.OptimizationSplitChunksCacheGroupTestFn;
type ModuleTestContext = Parameters<ModuleTest>[1];
type GroupFactory = () => Rspack.OptimizationSplitChunksCacheGroup;

const BOTH_AUTH_PAGES = ['sign-in-form-section', 'sign-up-form-section'];
const VENDOR_RESOURCE = '/app/node_modules/react-hook-form/dist/index.esm.mjs';
const WINDOWS_VENDOR_RESOURCE = 'C:\\app\\node_modules\\react-hook-form\\dist\\index.esm.mjs';
const APP_RESOURCE = '/app/src/components/ui-form/index.tsx';

const chunkNamed = (name: string | undefined): Rspack.Chunk => ({ name }) as Rspack.Chunk;

const admits = (
  factory: GroupFactory,
  chunkNames: readonly string[],
  resource: string | undefined
): boolean => {
  const module = { nameForCondition: () => resource } as unknown as Rspack.Module;
  const chunkGraph = {
    getModuleChunksIterable: (candidate: Rspack.Module) =>
      candidate === module ? chunkNames.map(chunkNamed) : [],
  } as unknown as ModuleTestContext['chunkGraph'];

  return (factory().test as ModuleTest)(module, {
    chunkGraph,
    moduleGraph: {} as ModuleTestContext['moduleGraph'],
  });
};

const groups: [string, GroupFactory][] = [
  ['authFormsVendorsCacheGroup', authFormsVendorsCacheGroup],
  ['authFormsCacheGroup', authFormsCacheGroup],
];

describe('auth-form cache groups', () => {
  it('names the two chunks and keeps the shared-module thresholds', () => {
    expect(AUTH_FORMS_VENDORS_CHUNK).toBe('auth-forms-vendors');
    expect(AUTH_FORMS_CHUNK).toBe('auth-forms');
    [
      [authFormsVendorsCacheGroup(), 'auth-forms-vendors'] as const,
      [authFormsCacheGroup(), 'auth-forms'] as const,
    ].forEach(([group, name]) => {
      expect(group).toMatchObject({ name, minChunks: 2, priority: 10, reuseExistingChunk: true });
    });
  });

  it('declares the two auth and the two recovery form-section chunks', () => {
    expect(AUTH_FORM_CHUNKS).toEqual(BOTH_AUTH_PAGES);
    expect(RECOVERY_FORM_CHUNKS).toEqual([
      'reset-password-form-section',
      'create-new-password-form-section',
    ]);
  });

  describe.each(groups)('%s', (_label, factory) => {
    it.each([
      ['sign-in-form-section', true],
      ['sign-up-form-section', true],
      ['reset-password-form-section', true],
      ['create-new-password-form-section', true],
      ['sign-in', false],
      ['reset-password', false],
      ['index', false],
      [undefined, false],
    ])('selects chunk %s: %s', (name, selected) => {
      const chunks = factory().chunks as ChunkFilter;

      expect(chunks(chunkNamed(name))).toBe(selected);
    });

    it.each([
      [['sign-in-form-section', 'reset-password-form-section']],
      [['sign-up-form-section', 'create-new-password-form-section']],
      [['reset-password-form-section', 'create-new-password-form-section']],
      [['sign-in-form-section']],
      [[]],
    ])('rejects a module held by %j, whatever its resource', (chunks) => {
      [VENDOR_RESOURCE, APP_RESOURCE, undefined].forEach((resource) => {
        expect({ resource, admitted: admits(factory, chunks, resource) }).toEqual({
          resource,
          admitted: false,
        });
      });
    });
  });

  it.each([
    [BOTH_AUTH_PAGES, VENDOR_RESOURCE],
    [BOTH_AUTH_PAGES, WINDOWS_VENDOR_RESOURCE],
    [
      ['sign-up-form-section', 'reset-password-form-section', 'sign-in-form-section'],
      VENDOR_RESOURCE,
    ],
  ])('sends a node_modules module held by %j only to the vendors group', (chunks, resource) => {
    expect(admits(authFormsVendorsCacheGroup, chunks, resource)).toBe(true);
    expect(admits(authFormsCacheGroup, chunks, resource)).toBe(false);
  });

  it.each([
    [BOTH_AUTH_PAGES, APP_RESOURCE],
    [BOTH_AUTH_PAGES, '/app/src/node_modules-like/index.ts'],
    [BOTH_AUTH_PAGES, undefined],
    [
      ['sign-up-form-section', 'create-new-password-form-section', 'sign-in-form-section'],
      APP_RESOURCE,
    ],
  ])('sends an app module held by %j at %s only to the app group', (chunks, resource) => {
    expect(admits(authFormsCacheGroup, chunks, resource)).toBe(true);
    expect(admits(authFormsVendorsCacheGroup, chunks, resource)).toBe(false);
  });
});
