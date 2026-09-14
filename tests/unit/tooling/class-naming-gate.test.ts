// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

type SuffixEntry = { suffix: string; role: string; lineage: string };

type ClassNamingPolicy = {
  APPROVED_SUFFIXES: SuffixEntry[];
  BANNED_SUFFIXES: string[];
  BARE_SERVICE_NAMES: string[];
  approvedSuffixPattern: () => string;
  bannedSuffixPattern: () => string;
  bareServicePattern: () => string;
  classNamingSelectors: () => Array<{ selector: string; message: string }>;
};

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const policy = require('../../../config/class-naming-policy.js') as ClassNamingPolicy;

const { Linter } = require('eslint') as typeof import('eslint');
const tsParser = require('@typescript-eslint/parser') as unknown;

const selectors = policy.classNamingSelectors();

const lint = (code: string): string[] =>
  new Linter({ configType: 'flat' })
    .verify(code, {
      languageOptions: { parser: tsParser as never, ecmaVersion: 'latest', sourceType: 'module' },
      rules: { 'no-restricted-syntax': ['error', ...selectors] },
    })
    .map((message) => message.message);

const messagesFor = (code: string, marker: string): number =>
  lint(code).filter((message) => message.includes(marker)).length;

const UNNAMED = 'Unnamed class';
const VAGUE = 'Vague class name';
const BARE = 'Domain-less Service';
const UNSUFFIXED = 'lacks an approved pattern suffix';

describe('class-naming policy (issue #129) — data', () => {
  it('lists every suffix once, PascalCase, with a role and a lineage', () => {
    const suffixes = policy.APPROVED_SUFFIXES.map((entry) => entry.suffix);

    expect(new Set(suffixes).size).toBe(suffixes.length);
    policy.APPROVED_SUFFIXES.forEach((entry) => {
      expect(entry.suffix).toMatch(/^[A-Z][A-Za-z]+$/);
      expect(entry.role.length).toBeGreaterThan(8);
      expect(entry.lineage.length).toBeGreaterThan(3);
    });
  });

  it('keeps the banned and approved suffix sets disjoint', () => {
    const approved = new Set(policy.APPROVED_SUFFIXES.map((entry) => entry.suffix));

    policy.BANNED_SUFFIXES.forEach((banned) => expect(approved.has(banned)).toBe(false));
    expect(policy.BANNED_SUFFIXES).toEqual(
      expect.arrayContaining(['Manager', 'Helper', 'Util', 'Utils', 'Data', 'Info', 'Wrapper'])
    );
    expect(policy.BARE_SERVICE_NAMES).toEqual(['Service', 'AppService', 'MyService']);
  });

  it('anchors every pattern to the end (or whole) of the class name', () => {
    expect(policy.bannedSuffixPattern()).toMatch(/^\/\(\?:.*\)\$\/$/);
    expect(policy.approvedSuffixPattern()).toMatch(/^\/\.\(\?:.*\)\$\/$/);
    expect(policy.bareServicePattern()).toMatch(/^\/\^\(\?:.*\)\$\/$/);
  });
});

describe('class-naming policy (issue #129) — the real ESLint selectors compile and match', () => {
  it('installs four selectors, each covering declarations and class expressions', () => {
    expect(selectors).toHaveLength(4);
    selectors.forEach((entry) => {
      expect(entry.selector).toContain('ClassDeclaration');
      expect(entry.selector).toContain('ClassExpression');
      expect(entry.message).toContain('issue #129');
    });
  });

  it.each([
    'AuthManager',
    'ErrorHelper',
    'HttpUtil',
    'HttpUtils',
    'ResponseData',
    'UserInfo',
    'ApiWrapper',
    'ConfigObject',
    'CommonCommon',
    'MiscMisc',
    'StuffStuff',
  ])('bans the vague name %s', (name) => {
    expect(messagesFor(`class ${name} {}`, VAGUE)).toBe(1);
    expect(messagesFor(`const x = class ${name} {};`, VAGUE)).toBe(1);
  });

  it.each(['Service', 'AppService', 'MyService'])('bans the domain-less %s', (name) => {
    expect(messagesFor(`class ${name} {}`, BARE)).toBe(1);
    expect(messagesFor(`export default class ${name} {}`, BARE)).toBe(1);
  });

  it('does not mistake a domain-qualified Service for a bare one', () => {
    expect(messagesFor('class FeatureFlagService {}', BARE)).toBe(0);
    expect(lint('class FeatureFlagService {}')).toEqual([]);
  });

  it('requires an approved suffix on named classes', () => {
    expect(messagesFor('class LoginThing {}', UNSUFFIXED)).toBe(1);
    expect(messagesFor('const t = class LoginThing {};', UNSUFFIXED)).toBe(1);
  });

  it('rejects an unnamed class, whether default-exported or a class expression', () => {
    expect(messagesFor('export default class {}', UNNAMED)).toBe(1);
    expect(messagesFor('const anonymous = class {};', UNNAMED)).toBe(1);
    expect(messagesFor('class LoginMapper {}', UNNAMED)).toBe(0);
  });

  it('exempts only an abstract Base* superclass', () => {
    expect(lint('abstract class BaseThing { abstract run(): void; }')).toEqual([]);
    expect(messagesFor('abstract class Thing { abstract run(): void; }', UNSUFFIXED)).toBe(1);
    expect(messagesFor('class BaseThing {}', UNSUFFIXED)).toBe(1);
  });

  it.each(policy.APPROVED_SUFFIXES.map((entry) => entry.suffix))(
    'accepts a domain noun followed by %s',
    (suffix) => {
      expect(lint(`class Login${suffix} {}`)).toEqual([]);
    }
  );

  it.each(policy.APPROVED_SUFFIXES.map((entry) => entry.suffix))(
    'rejects the bare suffix %s with no domain noun in front of it',
    (suffix) => {
      expect(lint(`class ${suffix} {}`).length).toBeGreaterThan(0);
    }
  );

  it('matches the suffix as a whole word at the end, not anywhere inside the name', () => {
    expect(messagesFor('class ManagerOfLogins {}', VAGUE)).toBe(0);
    expect(messagesFor('class ManagerOfLogins {}', UNSUFFIXED)).toBe(1);
    expect(messagesFor('class LoginMapperX {}', UNSUFFIXED)).toBe(1);
  });
});

describe('class-naming policy (issue #129) — wiring and documentation', () => {
  const claude = readRepoFile('CLAUDE.md');
  const section = claude.slice(claude.indexOf('### Class naming convention'));

  it('is spread into both non-React override blocks of eslint.config.mjs', () => {
    const config = readRepoFile('eslint.config.mjs');

    expect(config).toContain("import classNamingPolicy from './config/class-naming-policy.js';");
    expect(config.match(/\.\.\.classNamingSelectors,/g)).toHaveLength(2);
  });

  it('documents every approved suffix with its role in the CLAUDE.md table', () => {
    expect(section.length).toBeGreaterThan(0);
    policy.APPROVED_SUFFIXES.forEach((entry) => {
      expect(section).toContain(`| \`*${entry.suffix}\``);
      expect(section).toContain(entry.role);
    });
  });

  it('documents every banned name in CLAUDE.md', () => {
    policy.BANNED_SUFFIXES.forEach((banned) => expect(section).toContain(`\`${banned}\``));
    expect(section).toContain('domain-less bare `Service`');
  });

  it('is listed in the mandatory skill check and the decision guide', () => {
    expect(readRepoFile('.claude/skills/AI-AGENT-GUIDE.md')).toContain('class-naming-policy.js');
    expect(readRepoFile('.claude/skills/SKILL-DECISION-GUIDE.md')).toContain('role→suffix table');
    expect(readRepoFile('.claude/skills/architecture/SKILL.md')).toContain(
      'config/class-naming-policy.js'
    );
    expect(readRepoFile('AGENTS.md')).toContain('config/class-naming-policy.js');
  });
});
