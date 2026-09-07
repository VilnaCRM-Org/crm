import { closeSync, constants, fstatSync, openSync, readFileSync, readdirSync } from 'node:fs';
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
    // ENOENT is the one benign answer: a root that ships no modules yet. A root that is a *file*
    // is a misconfiguration, and swallowing it would pass the gate without checking one module.
    if (isErrnoCode(cause, 'ENOENT')) return [];
    if (isErrnoCode(cause, 'ENOTDIR')) {
      throw new Error(
        `docs-policy moduleDocs: "${moduleRoot}" is not a directory. ` +
          'Refusing to run with an unchecked module root.',
        { cause }
      );
    }
    throw cause;
  }
};

// One open, then fstat and read that same descriptor: the file classified is the file read, so
// there is still no check-then-use window (CodeQL js/file-system-race). O_NONBLOCK keeps a FIFO at
// the doc path from blocking the gate forever, and anything that is not a regular file — FIFO,
// device, or a *directory* named README.md — documents nothing, which is the ENOENT verdict too.
const readDoc = (absolute: string): string | null => {
  let fd: number;

  try {
    fd = openSync(absolute, constants.O_RDONLY | constants.O_NONBLOCK);
  } catch (cause) {
    if (isErrnoCode(cause, 'ENOENT', 'EISDIR')) return null;
    throw cause;
  }

  try {
    return fstatSync(fd).isFile() ? readFileSync(fd, 'utf8') : null;
  } finally {
    closeSync(fd);
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
