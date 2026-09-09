import fs from 'fs';
import path from 'path';

import CONSOLE_ALLOWLIST from '@tests/console-gate/allowlist';
import { isConsoleAllowed, isConsoleAllowedBy } from '@tests/console-gate/install';
import type { ConsoleAllowlistEntry } from '@tests/console-gate/types/console-allowlist-entry';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const packageJson = JSON.parse(readRepoFile('package.json')) as {
  devDependencies: Record<string, string>;
};

const declaredMajor = (packageName: string): number => {
  const range = packageJson.devDependencies[packageName];
  expect(range).toBeDefined();
  const major = /(\d+)/.exec(range as string)?.[1];
  expect(major).toBeDefined();
  return Number(major);
};

describe('console gate wiring', () => {
  it.each([
    ['jest.setup.ts', 'installConsoleGate()'],
    ['tests/integration/setup.ts', 'installConsoleGate()'],
    ['tests/mutation/setup.ts', 'installConsoleGate()'],
    ['tests/apollo-server/setup.ts', 'installConsoleGate({ failOnWarn: false })'],
  ])('installs the gate in %s', (setupFile, expectedCall) => {
    const source = readRepoFile(setupFile);

    expect(source).toContain('console-gate/install');
    expect(source).toContain(expectedCall);
  });

  it('wires every setup file jest.config.ts can select into setupFilesAfterEach', () => {
    const jestConfig = readRepoFile('jest.config.ts');

    expect(jestConfig).toContain('<rootDir>/tests/integration/setup.ts');
    expect(jestConfig).toContain('<rootDir>/tests/apollo-server/setup.ts');
    expect(jestConfig).toContain('<rootDir>/jest.setup.ts');
    expect(readRepoFile('jest.mutation.config.ts')).toContain('<rootDir>/tests/mutation/setup.ts');
  });

  it('fails on error everywhere and on warn everywhere but the node server', () => {
    const install = readRepoFile('tests/console-gate/install.ts');

    expect(install).toContain('shouldFailOnError: true');
    expect(install).toContain('shouldFailOnWarn: failOnWarn');
    expect(install).toContain('failOnWarn = true');
  });

  it.each(['shouldFailOnLog', 'shouldFailOnInfo', 'shouldFailOnDebug', 'shouldFailOnAssert'])(
    'leaves %s at its ungated default',
    (option) => {
      expect(readRepoFile('tests/console-gate/install.ts')).not.toContain(option);
    }
  );
});

describe('console gate allowlist discipline', () => {
  it('anchors every pattern at both ends so an entry reads as a whole-message rule', () => {
    for (const entry of CONSOLE_ALLOWLIST) {
      expect(entry.pattern.source.startsWith('^')).toBe(true);
      expect(entry.pattern.source.endsWith('$')).toBe(true);
    }
  });

  it('matches whole messages even when an entry is only partially anchored', () => {
    const partiallyAnchored: ConsoleAllowlistEntry[] = [
      {
        pattern: /^an allowed warning|swallowed$/,
        reason: 'A deliberately broken entry: alternation binds looser than the anchors.',
        expiresWith: { packageName: '@testing-library/react', removedInMajor: 16 },
      },
    ];

    expect(isConsoleAllowedBy('an allowed warning', partiallyAnchored)).toBe(true);
    expect(isConsoleAllowedBy('an allowed warning plus unrelated output', partiallyAnchored)).toBe(
      false
    );
    expect(isConsoleAllowedBy('unrelated output that is swallowed', partiallyAnchored)).toBe(false);
  });

  it('never lets a stateful pattern skip a message', () => {
    for (const entry of CONSOLE_ALLOWLIST) {
      expect(entry.pattern.global).toBe(false);
      expect(entry.pattern.sticky).toBe(false);
    }
  });

  it('rejects an allowlisted message that carries unrelated trailing output', () => {
    const rtlActDeprecation = [
      'Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`.',
      'Import `act` from `react` instead of `react-dom/test-utils`.',
      'See https://react.dev/warnings/react-dom-test-utils for more info.',
    ].join(' ');

    expect(
      isConsoleAllowed(`${rtlActDeprecation} Warning: Each child in a list needs a key.`)
    ).toBe(false);
  });

  it('documents why every entry exists', () => {
    for (const entry of CONSOLE_ALLOWLIST) {
      expect(entry.reason.trim().length).toBeGreaterThanOrEqual(40);
    }
  });

  it('expires every entry against a declared dependency so it cannot outlive its cause', () => {
    for (const entry of CONSOLE_ALLOWLIST) {
      const { packageName, removedInMajor } = entry.expiresWith;

      expect(packageJson.devDependencies[packageName]).toBeDefined();
      expect(declaredMajor(packageName)).toBeLessThan(removedInMajor);
    }
  });

  it('never allows a React warning that signals a real defect', () => {
    const realDefects = [
      'Warning: Each child in a list should have a unique "key" prop.',
      'Warning: An update to TestComponent inside a test was not wrapped in act(...).',
      'Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>.',
      'Warning: Failed prop type: The prop `value` is marked as required.',
      'react-i18next:: You will need to pass in an i18next instance by using initReactI18next',
      '⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates',
    ];

    for (const message of realDefects) {
      expect(isConsoleAllowed(message)).toBe(false);
    }
  });

  it('allows exactly the deprecation the pinned @testing-library/react emits', () => {
    const rtlActDeprecation = [
      'Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`.',
      'Import `act` from `react` instead of `react-dom/test-utils`.',
      'See https://react.dev/warnings/react-dom-test-utils for more info.',
    ].join(' ');

    expect(isConsoleAllowed(rtlActDeprecation)).toBe(true);
  });
});
