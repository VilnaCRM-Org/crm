// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const headerRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'components', 'ui-app-header');

const sources = (): string[] =>
  fs
    .readdirSync(headerRoot)
    .filter((name) => /\.tsx?$/u.test(name) && !name.endsWith('.stories.tsx'))
    .map((name) => fs.readFileSync(path.join(headerRoot, name), 'utf8'));

describe('app header source', () => {
  it('holds the files of the header', () => {
    expect(sources().length).toBeGreaterThanOrEqual(8);
  });

  it.each(['inert', ':has(', 'color-mix(', 'popover', 'showPopover'])(
    'does not use %s',
    (feature) => {
      sources().forEach((source) => expect(source).not.toContain(feature));
    }
  );

  it('uses no native CSS nesting: nested rules are written with the & selector', () => {
    sources().forEach((source) => expect(source).not.toMatch(/^\s*[.#][\w-]+\s*\{/mu));
  });

  it('imports nothing from the modules layer', () => {
    sources().forEach((source) => expect(source).not.toMatch(/from '@\/modules|from '@auth/u));
  });
});
