/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import type { Rspack } from '@rsbuild/core';

import {
  AUTH_FORM_CHUNKS,
  AUTH_FORMS_CHUNK,
  authFormsCacheGroup,
  RECOVERY_FORM_CHUNKS,
} from '@scripts/auth-forms-chunk-group';

type ChunkFilter = (chunk: Rspack.Chunk) => boolean;
type ModuleTest = Rspack.OptimizationSplitChunksCacheGroupTestFn;
type ModuleTestContext = Parameters<ModuleTest>[1];

const chunkNamed = (name: string | undefined): Rspack.Chunk => ({ name }) as Rspack.Chunk;

const moduleIn = (chunkNames: readonly string[]): boolean => {
  const group = authFormsCacheGroup();
  const module = {} as Rspack.Module;
  const chunkGraph = {
    getModuleChunksIterable: (candidate: Rspack.Module) =>
      candidate === module ? chunkNames.map(chunkNamed) : [],
  } as unknown as ModuleTestContext['chunkGraph'];

  return (group.test as ModuleTest)(module, {
    chunkGraph,
    moduleGraph: {} as ModuleTestContext['moduleGraph'],
  });
};

describe('authFormsCacheGroup', () => {
  it('names the auth-forms chunk and keeps the shared-module thresholds', () => {
    const group = authFormsCacheGroup();

    expect(AUTH_FORMS_CHUNK).toBe('auth-forms');
    expect(group).toMatchObject({
      name: 'auth-forms',
      minChunks: 2,
      priority: 10,
      reuseExistingChunk: true,
    });
  });

  it('declares the two auth and the two recovery form-section chunks', () => {
    expect(AUTH_FORM_CHUNKS).toEqual(['sign-in-form-section', 'sign-up-form-section']);
    expect(RECOVERY_FORM_CHUNKS).toEqual([
      'reset-password-form-section',
      'create-new-password-form-section',
    ]);
  });

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
    const chunks = authFormsCacheGroup().chunks as ChunkFilter;

    expect(chunks(chunkNamed(name))).toBe(selected);
  });

  it.each([
    [['sign-in-form-section', 'sign-up-form-section'], true],
    [['sign-up-form-section', 'reset-password-form-section', 'sign-in-form-section'], true],
    [['sign-in-form-section', 'reset-password-form-section'], false],
    [['sign-up-form-section', 'create-new-password-form-section'], false],
    [['reset-password-form-section', 'create-new-password-form-section'], false],
    [['sign-in-form-section'], false],
    [[], false],
  ])('admits a module held by %j only when both auth pages load it: %s', (chunks, admitted) => {
    expect(moduleIn(chunks)).toBe(admitted);
  });
});
