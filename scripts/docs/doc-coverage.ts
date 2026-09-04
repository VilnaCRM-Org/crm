import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { DocsViolation, ModuleDocsPolicy } from './docs-policy';

const isErrnoCode = (cause: unknown, ...codes: string[]): boolean =>
  codes.includes(String((cause as NodeJS.ErrnoException | null)?.code));

// One syscall per question, never check-then-use: `withFileTypes` classifies each entry from the
// same directory read, so nothing can change between the test and the use of its result.
const listModules = (root: string, moduleRoot: string): string[] => {
  try {
    return readdirSync(join(root, moduleRoot), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (cause) {
    if (isErrnoCode(cause, 'ENOENT', 'ENOTDIR')) return [];
    throw cause;
  }
};

// ENOENT: no doc file at all. EISDIR: a *directory* named README.md documents nothing. Both are
// the same verdict, and reading is the only operation — an existsSync/statSync pair ahead of it
// would be a TOCTOU window for no gain.
const readDoc = (absolute: string): string | null => {
  try {
    return readFileSync(absolute, 'utf8');
  } catch (cause) {
    if (isErrnoCode(cause, 'ENOENT', 'EISDIR')) return null;
    throw cause;
  }
};

/**
 * Every module must ship a README describing its purpose and public surface, so a module can
 * never be added undocumented (issue #122).
 */
export const checkDocCoverage = (root: string, policy: ModuleDocsPolicy): DocsViolation[] => {
  // A policy edit must not be able to point the required file outside the module directory.
  if (policy.requiredFile !== basename(policy.requiredFile) || policy.requiredFile.includes('..')) {
    throw new Error(
      `docs-policy moduleDocs: "requiredFile" must be a bare filename, got ` +
        `"${policy.requiredFile}". Refusing to run with an escapable doc-coverage gate.`
    );
  }

  return policy.roots.flatMap((moduleRoot) =>
    listModules(root, moduleRoot).flatMap<DocsViolation>((name) => {
      const docPath = `${moduleRoot}/${name}/${policy.requiredFile}`;
      const contents = readDoc(join(root, docPath));

      if (contents === null) {
        return [
          {
            rule: 'missing-module-doc',
            subject: `${moduleRoot}/${name}`,
            message: `has no ${policy.requiredFile} file — document its purpose and public API`,
          },
        ];
      }

      if (contents.trim() === '') {
        return [
          {
            rule: 'empty-module-doc',
            subject: docPath,
            message: 'module documentation is empty',
          },
        ];
      }

      return [];
    })
  );
};
