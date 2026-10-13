import type { Rspack } from '@rsbuild/core';

export const AUTH_FORMS_CHUNK = 'auth-forms';
export const AUTH_FORM_CHUNKS: readonly string[] = ['sign-in-form-section', 'sign-up-form-section'];
export const RECOVERY_FORM_CHUNKS: readonly string[] = [
  'reset-password-form-section',
  'create-new-password-form-section',
];

const formSectionChunks = new Set([...AUTH_FORM_CHUNKS, ...RECOVERY_FORM_CHUNKS]);

/**
 * One `auth-forms` chunk for the modules both auth pages load (issue #315). Membership is decided
 * per module: a module joins only when the sign-in AND the sign-up form-section chunks both
 * contain it, so nothing recovery-only can reach the `/sign-in` critical path. The `chunks` filter
 * also admits the two recovery form-section chunks, so a recovery route that needs one of those
 * shared modules depends on the same `auth-forms` chunk — already cached after `/sign-in` — instead
 * of carrying its own copy.
 */
export const authFormsCacheGroup = (): Rspack.OptimizationSplitChunksCacheGroup => ({
  name: AUTH_FORMS_CHUNK,
  chunks: (chunk) => formSectionChunks.has(chunk.name ?? ''),
  test: (module, { chunkGraph }) => {
    const owners = new Set(
      Array.from(chunkGraph.getModuleChunksIterable(module), (chunk) => chunk.name)
    );
    return AUTH_FORM_CHUNKS.every((name) => owners.has(name));
  },
  minChunks: 2,
  priority: 10,
  reuseExistingChunk: true,
});
