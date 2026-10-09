// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const AUTH_STORE = 'src/modules/user/features/auth/stores/use-auth-store.ts';
const CONNECTIVITY_STORE = 'src/lib/connectivity/use-connectivity-store.ts';
const RETIRED_FILES = [
  'src/lib/state',
  'src/modules/user/features/auth/stores/auth-var.ts',
  'src/lib/connectivity/connectivity-state-var.ts',
];
const ADR = 'docs/adr/023-zustand-client-state.md';
const PREVIOUS_ADR = 'docs/adr/008-frontend-state-architecture.md';
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

describe('frontend state architecture contract (issue #110, ADR-008, ADR-023)', () => {
  it('declares zustand as a production dependency and locks it', () => {
    const manifest = JSON.parse(readFile('package.json')) as Record<string, unknown>;
    const dependencies = manifest.dependencies as Record<string, string>;
    const devDependencies = (manifest.devDependencies ?? {}) as Record<string, string>;

    expect(dependencies.zustand).toBe('^5.0.15');
    expect(Object.keys(devDependencies)).not.toContain('zustand');
    expect(readFile('bun.lock')).toContain('"zustand": ["zustand@5.0.15"');
  });

  it('imports zustand only from its root specifier, so no middleware subpath can appear', () => {
    const importers = sourceFilesMatching(/from\s+['"]zustand['"]/);

    expect(importers).toEqual(expect.arrayContaining([AUTH_STORE, CONNECTIVITY_STORE]));
    expect(sourceFilesMatching(/['"]zustand\//)).toEqual([]);
  });

  it('creates both stores with create<State>() and no middleware', () => {
    expect(readFile(AUTH_STORE)).toContain('create<AuthState>()(');
    expect(readFile(CONNECTIVITY_STORE)).toContain('create<ConnectivityState>()(');
  });

  it('subscribes React to a store nowhere in src, since zustand owns the bridge', () => {
    expect(sourceFilesMatching(/useSyncExternalStore/)).toEqual([]);
  });

  it('deletes the reactive-var primitive and every name that used it', () => {
    RETIRED_FILES.forEach((retired) => {
      expect(fs.existsSync(path.join(projectRoot, retired))).toBe(false);
    });
    expect(
      sourceFilesMatching(/ReactiveVarFactory|useReactiveVar|AuthStateVar|ConnectivityStateVar/)
    ).toEqual([]);
  });

  it('supersedes ADR-008 with ADR-023 and indexes it, leaving ADR-002 superseded', () => {
    const previous = readFile(PREVIOUS_ADR);
    const adr = readFile(ADR);
    const superseded = readFile(SUPERSEDED_ADR);
    const index = readFile('docs/adr/README.md');

    expect(adr).toMatch(/^- Status: Approved$/m);
    expect(adr).toMatch(/^- Deciders: \[@kravalg\]\(https:\/\/github\.com\/kravalg\)$/m);
    expect(previous).toMatch(/^- Status: Superseded$/m);
    expect(previous).toContain('023-zustand-client-state.md');
    expect(superseded).toMatch(/^- Status: Superseded$/m);
    expect(superseded).toContain('008-frontend-state-architecture.md');
    expect(index).toContain('./023-zustand-client-state.md');
  });

  it('defines exactly the three state categories in the ADR and the guide', () => {
    const adr = readFile(ADR);
    const guide = readFile(GUIDE);

    for (const category of ['Server state', 'Client/UI state', 'Session state']) {
      expect(adr).toContain(`**${category}**`);
      expect(guide).toContain(category);
    }
    expect(adr).toContain('useAuthStore');
    expect(adr).toContain('AUTH_TOKENS.AuthStore');
    expect(adr).toContain('persist');
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
