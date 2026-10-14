import type { Rspack } from '@rsbuild/core';

export const AUTH_FORMS_CHUNK = 'auth-forms';
export const AUTH_FORMS_VENDORS_CHUNK = 'auth-forms-vendors';
export const AUTH_FORM_CHUNKS: readonly string[] = ['sign-in-form-section', 'sign-up-form-section'];
export const RECOVERY_FORM_CHUNKS: readonly string[] = [
  'reset-password-form-section',
  'create-new-password-form-section',
];

const formSectionChunks = new Set([...AUTH_FORM_CHUNKS, ...RECOVERY_FORM_CHUNKS]);
const NODE_MODULES = /[\\/]node_modules[\\/]/;

/**
 * Two chunks for the modules both auth pages load (issue #315): `auth-forms-vendors` for the
 * shared node_modules and `auth-forms` for the shared app code. Membership is decided per module:
 * a module joins only when the sign-in AND the sign-up form-section chunks both contain it, so
 * nothing recovery-only can reach the `/sign-in` critical path. The `chunks` filter also admits
 * the two recovery form-section chunks, so a recovery route that needs one of those shared modules
 * depends on the same chunks — already cached after `/sign-in` — instead of carrying its own copy.
 */
const sharedFormModulesGroup = (
  name: string,
  fromNodeModules: boolean
): Rspack.OptimizationSplitChunksCacheGroup => ({
  name,
  chunks: (chunk) => formSectionChunks.has(chunk.name ?? ''),
  test: (module, { chunkGraph }) => {
    const owners = new Set(
      Array.from(chunkGraph.getModuleChunksIterable(module), (chunk) => chunk.name)
    );
    return (
      AUTH_FORM_CHUNKS.every((owner) => owners.has(owner)) &&
      NODE_MODULES.test(module.nameForCondition() ?? '') === fromNodeModules
    );
  },
  minChunks: 2,
  priority: 10,
  reuseExistingChunk: true,
});

export const authFormsVendorsCacheGroup = (): Rspack.OptimizationSplitChunksCacheGroup =>
  sharedFormModulesGroup(AUTH_FORMS_VENDORS_CHUNK, true);

export const authFormsCacheGroup = (): Rspack.OptimizationSplitChunksCacheGroup =>
  sharedFormModulesGroup(AUTH_FORMS_CHUNK, false);
