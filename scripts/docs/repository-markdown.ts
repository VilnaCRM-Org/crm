import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { resolve } from 'node:path';

import type { DocsScanPolicy } from './docs-policy';
import { listMarkdownFiles, toRepoPath } from './markdown';

/** Static inventory only: architecture drift still requires real Git history. */
export const repositoryMarkdown = (root: string, policy: DocsScanPolicy): string[] => {
  // DinD copies source without .git. Existing metadata, even a broken worktree
  // file or dangling symlink, must not turn a Git failure into an archive scan.
  if (lstatSync(resolve(root, '.git'), { throwIfNoEntry: false }) === undefined) {
    const files = listMarkdownFiles(root, policy).map((file) => toRepoPath(root, file));
    if (files.length === 0) {
      throw new Error(
        'lint-docs: source archive contains no markdown under the documentation policy — ' +
          'refusing to pass vacuously.'
      );
    }
    return files;
  }

  // Scope safe.directory to the host-owned checkout mounted into the dev container.
  const listed = execFileSync('git', ['-c', `safe.directory=${root}`, 'ls-files', '-z', '*.md'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (listed === '') {
    throw new Error(
      'lint-docs: `git ls-files` returned no markdown. Run the gate inside the repository — ' +
        'refusing to pass vacuously.'
    );
  }

  // Preserve the checkout gate: omit files deleted from the worktree, but retain
  // broken symlinks so downstream reads fail rather than silently dropping checks.
  return listed
    .split('\0')
    .filter((file) => file !== '')
    .filter((file) => {
      try {
        lstatSync(resolve(root, file));
        return true;
      } catch {
        return false;
      }
    });
};
