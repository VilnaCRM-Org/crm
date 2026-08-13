import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { DocsViolation, ModuleDocsPolicy } from './docs-policy';

const listModules = (root: string, moduleRoot: string): string[] => {
  const absolute = join(root, moduleRoot);
  if (!existsSync(absolute)) {
    return [];
  }

  return readdirSync(absolute)
    .filter((name) => statSync(join(absolute, name)).isDirectory())
    .sort((a, b) => a.localeCompare(b));
};

/**
 * Every module must ship a README describing its purpose and public surface, so a module can
 * never be added undocumented (issue #122).
 */
export const checkDocCoverage = (root: string, policy: ModuleDocsPolicy): DocsViolation[] =>
  policy.roots.flatMap((moduleRoot) =>
    listModules(root, moduleRoot).flatMap<DocsViolation>((name) => {
      const docPath = `${moduleRoot}/${name}/${policy.requiredFile}`;
      const absolute = join(root, docPath);

      // isFile, not existsSync: a *directory* named README.md documents nothing.
      if (!existsSync(absolute) || !statSync(absolute).isFile()) {
        return [
          {
            rule: 'missing-module-doc',
            subject: `${moduleRoot}/${name}`,
            message: `has no ${policy.requiredFile} file — document its purpose and public API`,
          },
        ];
      }

      if (readFileSync(absolute, 'utf8').trim() === '') {
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
