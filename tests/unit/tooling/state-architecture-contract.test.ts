// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const STATE_HOME = 'src/lib/state';
const BRIDGE = `${STATE_HOME}/use-reactive-var.ts`;
const ADR = 'docs/adr/008-frontend-state-architecture.md';
const SUPERSEDED_ADR = 'docs/adr/002-zustand-over-redux.md';
const GUIDE = 'docs/state-architecture.md';
const CONTRIBUTOR_DOCS = ['CLAUDE.md', 'AGENTS.md', '.github/copilot-instructions.md'];

function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(projectRoot, dir))) {
    const relative = path.join(dir, entry);
    if (fs.statSync(path.join(projectRoot, relative)).isDirectory()) walkSource(relative, acc);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry))) acc.push(relative);
  }
  return acc;
}

const sourceFilesMatching = (pattern: RegExp): string[] =>
  walkSource('src').filter((file) => pattern.test(readFile(file)));

describe('frontend state architecture contract (issue #110, ADR-008)', () => {
  it('declares no zustand dependency in any package.json dependency map', () => {
    const manifest = JSON.parse(readFile('package.json')) as Record<string, unknown>;
    const maps = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

    for (const map of maps) {
      expect(Object.keys((manifest[map] ?? {}) as Record<string, string>)).not.toContain('zustand');
    }
    expect(readFile('bun.lock')).not.toContain('"zustand"');
  });

  it('imports zustand nowhere under src/', () => {
    expect(sourceFilesMatching(/from\s+['"]zustand(\/|['"])/)).toEqual([]);
  });

  it('subscribes React to a store only through the one sanctioned bridge', () => {
    expect(sourceFilesMatching(/useSyncExternalStore/)).toEqual([BRIDGE]);
  });

  it('keeps the reactive-var primitive in the neutral state home, off the auth feature', () => {
    const home = fs.readdirSync(path.join(projectRoot, STATE_HOME)).sort();

    expect(home).toEqual([
      'reactive-var-factory.ts',
      'reactive-var-state.ts',
      'types',
      'use-reactive-var.ts',
    ]);
    expect(readFile('src/modules/user/features/auth/stores/auth-var.ts')).toContain(
      "from '@/lib/state/reactive-var-factory'"
    );
    expect(
      fs.existsSync(path.join(projectRoot, 'src/modules/user/features/auth/stores/reactive-var.ts'))
    ).toBe(false);
  });

  it('supersedes ADR-002 with ADR-008 and indexes both', () => {
    const superseded = readFile(SUPERSEDED_ADR);
    const adr = readFile(ADR);
    const index = readFile('docs/adr/README.md');

    expect(superseded).toMatch(/^- Status: Superseded$/m);
    expect(superseded).toContain('008-frontend-state-architecture.md');
    expect(adr).toMatch(/^- Status: Approved$/m);
    expect(index).toContain('./008-frontend-state-architecture.md');
  });

  it('defines exactly the three state categories in the ADR and the guide', () => {
    const adr = readFile(ADR);
    const guide = readFile(GUIDE);

    for (const category of ['Server state', 'Client/UI state', 'Session state']) {
      expect(adr).toContain(`**${category}**`);
      expect(guide).toContain(category);
    }
    expect(adr).toContain('useReactiveVar');
    expect(adr).toContain('no-apollo-client-outside-data-layer');
    expect(adr).toContain('no-shared-ui-to-http-client');
  });

  it('keeps the contributor guides on the reactive var, never on a Zustand store', () => {
    for (const doc of CONTRIBUTOR_DOCS) {
      const text = readFile(doc);

      expect(text).not.toMatch(/Zustand Store Pattern/);
      expect(text).not.toMatch(/useAuthStore/);
      expect(text).not.toMatch(/State Management\*\*: Zustand/);
      expect(text).not.toMatch(/Stores use Zustand/);
    }
    expect(readFile('CLAUDE.md')).toContain('src/lib/state/');
    expect(readFile('AGENTS.md')).toContain('useReactiveVar');
    expect(readFile('.claude/react-sdlc.yml')).toMatch(/^\s+state: reactive-var$/m);
  });

  it('names the gates in the guide so a reader can map a failure to its rule', () => {
    const guide = readFile(GUIDE);
    const eslintConfig = readFile('eslint.config.mjs');
    const depcruise = readFile('.dependency-cruiser.js');

    expect(guide).toContain('clientStateSelectors');
    expect(eslintConfig).toContain('const clientStateSelectors = [');
    for (const rule of ['no-apollo-client-outside-data-layer', 'no-shared-ui-to-http-client']) {
      expect(guide).toContain(rule);
      expect(depcruise).toContain(`name: '${rule}'`);
    }
  });
});
