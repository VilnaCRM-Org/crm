import { readFileSync } from 'fs';
import path from 'path';

import Ajv from 'ajv';

import { assertDefined, elementAt } from '@tests/utils/assert-result';

import {
  type BrowserFamilyPolicy,
  type BrowserSupportPolicy,
  checkQueries,
  checkReadme,
  checkResolution,
  compareVersions,
  parseMatrixRows,
  parsePolicy,
  parseVersion,
  POLYFILL_MODES,
  resolveFamilies,
} from '../../../scripts/ci/browser-support';

const repoRoot = path.resolve(__dirname, '../../..');
const policyPath = path.join(repoRoot, 'config/browser-support.json');
const schemaPath = path.join(repoRoot, 'config/browser-support.schema.json');
const manifestPath = path.join(repoRoot, 'package.json');
const readmePath = path.join(repoRoot, 'README.md');

const readRaw = (): Record<string, unknown> =>
  JSON.parse(readFileSync(policyPath, 'utf8')) as Record<string, unknown>;

const readPolicy = (): BrowserSupportPolicy => parsePolicy(readRaw(), policyPath);

const withFamily = (family: string, value: unknown): Record<string, unknown> => {
  const raw = readRaw();
  return { ...raw, families: { ...(raw.families as Record<string, unknown>), [family]: value } };
};

const withoutFamily = (
  policy: BrowserSupportPolicy,
  dropped: string
): Record<string, BrowserFamilyPolicy> =>
  Object.fromEntries(Object.entries(policy.families).filter(([family]) => family !== dropped));

const rulesOf = (violations: readonly { rule: string }[]): string[] =>
  violations.map((violation) => violation.rule);

const familyRow = (family: BrowserFamilyPolicy, floor?: string): string =>
  `| ${family.label} | ${floor ?? family.floor ?? 'latest'} |`;

const renderReadme = (section: string, rows: readonly string[]): string =>
  [
    '# Template',
    '',
    `## ${section}`,
    '',
    '| Browser | Minimum version |',
    '| ------- | --------------- |',
    ...rows,
    '',
    '## Documentation',
    '',
  ].join('\n');

const allRows = (policy: BrowserSupportPolicy): string[] =>
  Object.values(policy.families).map((family) => familyRow(family));

const rowsWithStated = (policy: BrowserSupportPolicy, family: string, stated: string): string[] => {
  const target = policy.families[family];
  assertDefined(target);

  return allRows(policy).map((row) =>
    row.startsWith(`| ${target.label} |`) ? familyRow(target, stated) : row
  );
};

describe('parseVersion', () => {
  it('reads a plain major version as a single-element tuple', () => {
    expect(parseVersion('111')).toEqual([111]);
  });

  it('reads a dotted version as one element per part', () => {
    expect(parseVersion('16.4')).toEqual([16, 4]);
  });

  it('reads a caniuse range by its lower bound', () => {
    expect(parseVersion('16.0-16.3')).toEqual([16, 0]);
  });

  it('reads a caniuse range written with an en dash by its lower bound', () => {
    expect(parseVersion('16.0–16.3')).toEqual([16, 0]);
  });

  it('maps a non-numeric token to a sentinel below every real version', () => {
    expect(parseVersion('TP')).toEqual([-1]);
  });
});

describe('compareVersions', () => {
  it('orders dotted versions numerically rather than lexicographically', () => {
    expect(compareVersions('16.4', '16.10')).toBeLessThan(0);
    expect(compareVersions('16.10', '16.4')).toBeGreaterThan(0);
  });

  it('treats equal plain versions as equal', () => {
    expect(compareVersions('111', '111')).toBe(0);
  });

  it('pads a missing minor part with zero', () => {
    expect(compareVersions('16', '16.0')).toBe(0);
  });

  it('compares a caniuse range by its lower bound', () => {
    expect(compareVersions('16.0-16.3', '16.0')).toBe(0);
    expect(compareVersions('16.0-16.3', '16.4')).toBeLessThan(0);
  });
});

describe('parsePolicy', () => {
  it('keeps POLYFILL_MODES pinned to the schema enum', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as {
      properties: { polyfill: { enum: string[] } };
    };

    expect([...POLYFILL_MODES]).toEqual(schema.properties.polyfill.enum);
  });

  it('accepts the committed browser support policy', () => {
    const policy = readPolicy();

    expect(policy.polyfill).toBe('off');
    expect(policy.queries.length).toBeGreaterThan(0);
    expect(Object.keys(policy.families).length).toBeGreaterThan(0);
    expect(policy.readmeSection).toBe('Supported browsers');
  });

  it('rejects a policy that is not a JSON object', () => {
    expect(() => parsePolicy(null, policyPath)).toThrow(/policy must be a JSON object/);
    expect(() => parsePolicy('nope', policyPath)).toThrow(
      /Refusing to run with an unenforced browser matrix/
    );
  });

  it('rejects an unknown polyfill mode', () => {
    expect(() => parsePolicy({ ...readRaw(), polyfill: 'auto' }, policyPath)).toThrow(
      /"polyfill" must be one of "off", "usage", "entry"/
    );
  });

  it('rejects an empty query list', () => {
    expect(() => parsePolicy({ ...readRaw(), queries: [] }, policyPath)).toThrow(
      /"queries" must be a non-empty array/
    );
  });

  it('rejects a family that declares both a floor and trackLatest', () => {
    const raw = withFamily('chrome', { label: 'Chrome', floor: '111', trackLatest: true });

    expect(() => parsePolicy(raw, policyPath)).toThrow(
      /families \[chrome\] must each declare a label and exactly one of "floor" or "trackLatest"/
    );
  });

  it('rejects a family that declares neither a floor nor trackLatest', () => {
    expect(() => parsePolicy(withFamily('chrome', { label: 'Chrome' }), policyPath)).toThrow(
      /families \[chrome\]/
    );
  });
});

describe('checkQueries', () => {
  it('passes when the declared list matches the policy exactly', () => {
    const policy = readPolicy();

    expect(checkQueries(policy, policy.queries)).toEqual([]);
  });

  it('reports query drift when an entry is added', () => {
    const policy = readPolicy();
    const violations = checkQueries(policy, [...policy.queries, 'ie >= 11']);

    expect(rulesOf(violations)).toEqual(['query-drift']);
    expect(elementAt(violations, 0).subject).toBe('package.json browserslist.production');
    expect(elementAt(violations, 0).message).toContain('ie >= 11');
  });

  it('reports query drift when an entry is removed', () => {
    const policy = readPolicy();

    expect(rulesOf(checkQueries(policy, policy.queries.slice(1)))).toEqual(['query-drift']);
  });

  it('reports query drift when the entries are reordered', () => {
    const policy = readPolicy();
    const reordered = [
      elementAt(policy.queries, 1),
      elementAt(policy.queries, 0),
      ...policy.queries.slice(2),
    ];

    expect(reordered).toHaveLength(policy.queries.length);
    expect(rulesOf(checkQueries(policy, reordered))).toEqual(['query-drift']);
  });
});

describe('resolveFamilies', () => {
  it('groups a resolution into a per-family floor and version count', () => {
    const resolved = resolveFamilies(['chrome >= 111', 'and_chr >= 111']);

    expect(resolved.get('chrome')?.floor).toBe('111');
    expect(resolved.get('chrome')?.versions).toBeGreaterThan(1);
    expect(resolved.get('and_chr')?.versions).toBe(1);
  });
});

describe('checkResolution', () => {
  it('passes for the committed policy resolved against its own queries', () => {
    const policy = readPolicy();

    expect(checkResolution(policy, resolveFamilies(policy.queries))).toEqual([]);
  });

  it('reports floor drift when the policy pins a floor the query does not produce', () => {
    const policy = readPolicy();
    const resolved = resolveFamilies(policy.queries);
    const drifted = {
      ...policy,
      families: { ...policy.families, chrome: { label: 'Chrome', floor: '120' } },
    };
    const violations = checkResolution(drifted, resolved).filter(
      (violation) => violation.subject === 'chrome'
    );

    expect(rulesOf(violations)).toEqual(['floor-drift']);
    expect(elementAt(violations, 0).message).toBe('Chrome floor is 111, policy pins 120');
  });

  it('reports a missing family when the policy names a browser the query cannot produce', () => {
    const policy = readPolicy();
    const resolved = resolveFamilies(policy.queries);
    const extended = {
      ...policy,
      families: { ...policy.families, ie: { label: 'Internet Explorer', floor: '11' } },
    };
    const violations = checkResolution(extended, resolved).filter(
      (violation) => violation.subject === 'ie'
    );

    expect(rulesOf(violations)).toEqual(['missing-family']);
    expect(elementAt(violations, 0).message).toContain('absent from the resolution');
  });

  it('reports an unexpected family when the query produces a browser the policy dropped', () => {
    const policy = readPolicy();
    const resolved = resolveFamilies(policy.queries);
    const narrowed = { ...policy, families: withoutFamily(policy, 'opera') };
    const violations = checkResolution(narrowed, resolved);

    expect(rulesOf(violations)).toEqual(['unexpected-family']);
    expect(elementAt(violations, 0).subject).toBe('opera');
  });

  it('reports latest-only drift when a trackLatest family resolves to many versions', () => {
    const policy = readPolicy();
    const latestOnly = {
      ...policy,
      families: { chrome: { label: 'Chrome', trackLatest: true as const } },
    };
    const violations = checkResolution(latestOnly, resolveFamilies(['chrome >= 111']));

    expect(rulesOf(violations)).toEqual(['latest-only-drift']);
    expect(elementAt(violations, 0).message).toContain('declared latest-only');
  });
});

describe('checkReadme', () => {
  it('rejects a version cell whose digits are separated by an underscore', () => {
    const policy = readPolicy();
    const rows = rowsWithStated(policy, 'chrome', '1_11');

    expect(rulesOf(checkReadme(policy, renderReadme(policy.readmeSection, rows)))).toEqual([
      'readme-drift',
    ]);
  });

  it('reports a README row for a browser the policy does not declare', () => {
    const policy = readPolicy();
    const rows = [...allRows(policy), '| Internet Explorer | 11 |'];
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, rows));

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).subject).toBe('Internet Explorer');
  });

  it('rejects an annotated version cell rather than reading its numeric prefix', () => {
    const policy = readPolicy();
    const rows = rowsWithStated(policy, 'chrome', '111 (or newer)');

    expect(rulesOf(checkReadme(policy, renderReadme(policy.readmeSection, rows)))).toEqual([
      'readme-drift',
    ]);
  });

  it('accepts a heading written with a closing hash sequence', () => {
    const policy = readPolicy();
    const readme = renderReadme(policy.readmeSection, allRows(policy)).replace(
      `## ${policy.readmeSection}`,
      `## ${policy.readmeSection} ##`
    );

    expect(checkReadme(policy, readme)).toEqual([]);
  });

  it('binds to the exact heading rather than one that merely mentions it', () => {
    const policy = readPolicy();
    const decoy = [
      `## How the ${policy.readmeSection} matrix is enforced`,
      '',
      '| Browser | Minimum version |',
      '| ------- | --------------- |',
      '| Chrome  | 1               |',
      '',
    ].join('\n');
    const readme = `${decoy}\n${renderReadme(policy.readmeSection, allRows(policy))}`;

    expect(checkReadme(policy, readme)).toEqual([]);
  });

  it('passes against the published README matrix', () => {
    const policy = readPolicy();

    expect(checkReadme(policy, readFileSync(readmePath, 'utf8'))).toEqual([]);
  });

  it('passes against a rendered matrix that lists every family and floor', () => {
    const policy = readPolicy();

    expect(checkReadme(policy, renderReadme(policy.readmeSection, allRows(policy)))).toEqual([]);
  });

  it('reports readme drift when the section is absent', () => {
    const policy = readPolicy();
    const violations = checkReadme(policy, '# Template\n\n## Documentation\n\nNothing here.\n');

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).subject).toBe(policy.readmeSection);
    expect(elementAt(violations, 0).message).toContain('README has no such section');
  });

  it('reports one readme drift when the section heading has no body at all', () => {
    const policy = readPolicy();
    const readme = `# Template\n## ${policy.readmeSection}\n## Documentation\n\nNothing.\n`;
    const violations = checkReadme(policy, readme);

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).message).toContain('README has no such section');
  });

  it('reports one readme drift per family when the table lists none of them', () => {
    const policy = readPolicy();
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, []));

    expect(violations).toHaveLength(Object.keys(policy.families).length);
    expect(new Set(rulesOf(violations))).toEqual(new Set(['readme-drift']));
  });

  it('reports readme drift when a family has no row at all', () => {
    const policy = readPolicy();
    const rows = allRows(policy).filter((row) => !row.includes('Samsung Internet'));
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, rows));

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).subject).toBe('samsung');
    expect(elementAt(violations, 0).message).toBe(
      `README section "${policy.readmeSection}" has no row for Samsung Internet`
    );
  });

  it('reports the family whose own row states the wrong floor, row-wise', () => {
    const policy = readPolicy();
    const rows = rowsWithStated(policy, 'samsung', '21');
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, rows));

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).subject).toBe('samsung');
    expect(elementAt(violations, 0).message).toBe(
      'README states Samsung Internet "21", policy pins "22"'
    );
  });

  it('reports a row reading "latest" even when a sibling row carries that family floor', () => {
    const policy = readPolicy();
    const rows = rowsWithStated(policy, 'chrome', 'latest');
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, rows));

    expect(rows.some((row) => row === '| Edge | 111 |')).toBe(true);
    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).subject).toBe('chrome');
    expect(elementAt(violations, 0).message).toBe(
      'README states Chrome "latest", policy pins "111"'
    );
  });

  it('reports a trackLatest family whose row pins a version instead of "latest"', () => {
    const policy = readPolicy();
    const rows = rowsWithStated(policy, 'and_chr', '151');
    const violations = checkReadme(policy, renderReadme(policy.readmeSection, rows));

    expect(rulesOf(violations)).toEqual(['readme-drift']);
    expect(elementAt(violations, 0).message).toBe(
      'README states Chrome for Android "151", policy pins "latest"'
    );
  });

  it('compares the stated floor numerically rather than as a string', () => {
    const policy = readPolicy();
    const equivalent = rowsWithStated(policy, 'chrome', '111.0');
    const different = rowsWithStated(policy, 'chrome', '111.1');

    expect(checkReadme(policy, renderReadme(policy.readmeSection, equivalent))).toEqual([]);
    expect(rulesOf(checkReadme(policy, renderReadme(policy.readmeSection, different)))).toEqual([
      'readme-drift',
    ]);
  });
});

describe('parseMatrixRows', () => {
  it('keeps an underscore in a version cell so malformed text cannot read as a version', () => {
    expect(parseMatrixRows('| Chrome | 1_11 |').get('Chrome')).toBe('1_11');
  });

  it('still strips an underscore from a label', () => {
    expect(parseMatrixRows('| _Chrome_ | 111 |').get('Chrome')).toBe('111');
  });

  it('strips matched outer underscore emphasis from a version cell', () => {
    expect(parseMatrixRows('| Chrome | _111_ |').get('Chrome')).toBe('111');
    expect(parseMatrixRows('| Chrome | __16.4__ |').get('Chrome')).toBe('16.4');
  });

  it('skips the header and divider rows and trims every cell', () => {
    const body = [
      '| Browser                | Minimum version |',
      '| ---------------------- | --------------- |',
      '| Chrome                 | 111             |',
      '| Safari (macOS)         | 16.4            |',
    ].join('\n');

    expect([...parseMatrixRows(body)]).toEqual([
      ['Chrome', '111'],
      ['Safari (macOS)', '16.4'],
    ]);
  });

  it('reads a family whose label collides with the header cell', () => {
    const body = [
      '| Browser | Minimum version |',
      '| ------- | --------------- |',
      '| Browser | 42              |',
    ].join('\n');

    expect(parseMatrixRows(body).get('Browser')).toBe('42');
  });

  it('ignores emphasis and code markers so a bolded cell still states its value', () => {
    const body = ['| **Chrome** | `111` |', '| _Edge_ | **112** |'].join('\n');

    expect(parseMatrixRows(body).get('Chrome')).toBe('111');
    expect(parseMatrixRows(body).get('Edge')).toBe('112');
  });

  it('reads rows written with and without a trailing pipe', () => {
    const body = '| Chrome | 111 |\n| Edge | 112';

    expect(parseMatrixRows(body).get('Chrome')).toBe('111');
    expect(parseMatrixRows(body).get('Edge')).toBe('112');
  });

  it('ignores lines that are not table rows', () => {
    const body = 'Prose about | pipes.\n\n| Chrome | 111 |\n\nMore prose.';

    expect([...parseMatrixRows(body).keys()]).toEqual(['Chrome']);
  });

  it('ignores a row whose label cell is empty', () => {
    expect(parseMatrixRows('|  | 111 |\n| Chrome | 111 |').size).toBe(1);
  });

  it('keeps the last row when a label is repeated', () => {
    expect(parseMatrixRows('| Chrome | 111 |\n| Chrome | 120 |').get('Chrome')).toBe('120');
  });
});

describe('config/browser-support.json', () => {
  it('validates against config/browser-support.schema.json', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));

    expect(validate(readRaw())).toBe(true);
  });

  it('fails schema validation when a family declares both a floor and trackLatest', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));

    const raw = withFamily('chrome', { label: 'Chrome', floor: '111', trackLatest: true });

    expect(validate(raw)).toBe(false);
  });

  it('fails schema validation when an unknown top-level key is added', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));

    expect(validate({ ...readRaw(), unsupported: true })).toBe(false);
  });

  it('is the single source of truth for package.json browserslist.production', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      browserslist: { production: string[] };
    };

    expect(manifest.browserslist.production).toEqual(readPolicy().queries);
  });
});
