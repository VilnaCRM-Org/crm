/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const HOOK_SCRIPT = 'scripts/agent-session-start.sh';
const LOCAL_BMAD_DIRS = ['/_bmad/', '/.agents/', '/.claude/commands/'];

describe('agent process wiring (issue #146)', () => {
  it('keeps every bmalph-generated directory out of the repository', () => {
    const ignored = readRepoFile('.gitignore').split('\n');

    LOCAL_BMAD_DIRS.forEach((entry) => expect(ignored).toContain(entry));
  });

  it('documents the BMAD directories as local installs, never as repository paths', () => {
    ['CLAUDE.md', 'AGENTS.md', 'specs/README.md'].forEach((doc) => {
      const contents = readRepoFile(doc);

      expect(contents).toContain('bmalph init');
      expect(contents).toMatch(/gitignored|\.gitignore/);
    });
  });

  it('keeps repository-controlled hooks out of the committed Claude Code settings', () => {
    const settings = JSON.parse(readRepoFile('.claude/settings.json')) as {
      permissions: { allow: string[] };
      hooks?: unknown;
    };

    expect(settings.hooks).toBeUndefined();
    expect(settings.permissions.allow).toContain('Bash(make:*)');
    expect(readRepoFile('CLAUDE.md')).toContain(`sh ${HOOK_SCRIPT}`);
  });

  it('ships a diagnostic that reports and never blocks', () => {
    const script = readRepoFile(HOOK_SCRIPT);

    expect(script.startsWith('#!/usr/bin/env sh\n')).toBe(true);
    expect(script).not.toMatch(/^set -e/m);
    expect(script.trimEnd().endsWith('exit 0')).toBe(true);
    expect(script).toContain('make check-node-version');
    expect(script).toContain('bmalph init');
  });

  it('mirrors the conventions for GitHub Copilot', () => {
    const instructions = readRepoFile('.github/copilot-instructions.md');

    ['make format', 'make lint', 'make test-unit-all', 'useService'].forEach((token) =>
      expect(instructions).toContain(token)
    );
  });
});
