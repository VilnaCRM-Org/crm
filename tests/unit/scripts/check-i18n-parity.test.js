const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'ci', 'check-i18n-parity.mjs');

const EN_CATALOG = { greeting: { hello: 'Hello', bye: 'Bye' } };
const UK_CATALOG = { greeting: { hello: 'Привіт', bye: 'Бувай' } };

const fixtureRoots = [];

const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const writeText = (file, source) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source, 'utf8');
};

const createFixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-parity-spec-'));
  fixtureRoots.push(root);
  const scanRoot = path.join(root, 'src');
  const outputDir = path.join(scanRoot, 'i18n');
  fs.mkdirSync(outputDir, { recursive: true });
  const policyPath = path.join(root, 'i18n-catalog-policy.json');
  writeJson(policyPath, { lazyCatalogs: [] });
  return {
    scanRoot,
    outputDir,
    policyPath,
    mergedPath: path.join(outputDir, 'localization.json'),
  };
};

const declareLazy = (fixture, lazyCatalogs) => writeJson(fixture.policyPath, { lazyCatalogs });

const seedCatalog = (fixture, folder, en, uk) => {
  const dir = path.join(fixture.scanRoot, folder, 'i18n');
  fs.mkdirSync(dir, { recursive: true });
  if (en) writeJson(path.join(dir, 'en.json'), en);
  if (uk) writeJson(path.join(dir, 'uk.json'), uk);
  return dir;
};

const mergedFrom = (en, uk) => ({ en: { translation: en }, uk: { translation: uk } });

const seedMerged = (fixture, merged) => writeJson(fixture.mergedPath, merged);

const sourceFile = (fixture, name) => path.join(fixture.scanRoot, 'greeting-feature', name);

const cleanFixture = () => {
  const fixture = createFixture();
  seedCatalog(fixture, 'greeting-feature', EN_CATALOG, UK_CATALOG);
  seedMerged(fixture, mergedFrom(EN_CATALOG, UK_CATALOG));
  return fixture;
};

const runGate = (fixture, args = []) =>
  spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      I18N_SCAN_ROOT: fixture.scanRoot,
      I18N_OUTPUT_DIR: fixture.outputDir,
      I18N_CATALOG_POLICY: fixture.policyPath,
    },
  });

describe('check-i18n-parity gate', () => {
  afterEach(() => {
    while (fixtureRoots.length > 0) {
      fs.rmSync(fixtureRoots.pop(), { recursive: true, force: true });
    }
  });

  it('exits 0 when catalogs, merged output and call sites all agree', () => {
    const fixture = cleanFixture();
    writeText(sourceFile(fixture, 'panel.tsx'), "const label = t('greeting.hello');\n");

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails and names the folder when a required locale file is missing', () => {
    const fixture = createFixture();
    const dir = seedCatalog(fixture, 'greeting-feature', EN_CATALOG, null);
    seedMerged(fixture, { en: { translation: EN_CATALOG } });

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${dir}: missing required locale file(s) uk.json`);
    expect(result.status).toBe(1);
  });

  it('fails when a catalog folder holds an unexpected extra locale file', () => {
    const fixture = cleanFixture();
    const dir = path.join(fixture.scanRoot, 'greeting-feature', 'i18n');
    writeJson(path.join(dir, 'de.json'), { greeting: { hello: 'Hallo', bye: 'Tschüss' } });

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${dir}: unexpected file(s) de.json`);
    expect(result.status).toBe(1);
  });

  it('fails when a catalog file is not valid JSON', () => {
    const fixture = cleanFixture();
    const brokenFile = path.join(fixture.scanRoot, 'greeting-feature', 'i18n', 'uk.json');
    writeText(brokenFile, '{ "greeting": { "hello": ');

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${brokenFile}: invalid JSON`);
    expect(result.status).toBe(1);
  });

  it('fails and names the drifted key when en and uk differ inside one folder', () => {
    const fixture = createFixture();
    const en = { greeting: { hello: 'Hello', only_en: 'Only in English' } };
    const uk = { greeting: { hello: 'Привіт' } };
    const dir = seedCatalog(fixture, 'greeting-feature', en, uk);
    seedMerged(fixture, mergedFrom(en, uk));

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${dir}: en/uk key sets differ`);
    expect(result.stderr).toContain('missing from uk.json');
    expect(result.stderr).toContain('greeting.only_en');
    expect(result.status).toBe(1);
  });

  it('fails when the committed merged catalog is stale', () => {
    const fixture = createFixture();
    seedCatalog(fixture, 'greeting-feature', EN_CATALOG, UK_CATALOG);
    seedMerged(fixture, mergedFrom({ greeting: { hello: 'Hello' } }, UK_CATALOG));

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${fixture.mergedPath} is stale`);
    expect(result.stderr).toContain('en.translation.greeting.bye');
    expect(result.status).toBe(1);
  });

  it('exits 0 when the merged catalog differs from a regeneration only by key order', () => {
    const fixture = createFixture();
    seedCatalog(fixture, 'greeting-feature', EN_CATALOG, UK_CATALOG);
    const reversed = (catalog) => ({
      greeting: { bye: catalog.greeting.bye, hello: catalog.greeting.hello },
    });
    seedMerged(fixture, {
      uk: { translation: reversed(UK_CATALOG) },
      en: { translation: reversed(EN_CATALOG) },
    });

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails and names the file and key for a t() call on an undefined key', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'panel.tsx');
    writeText(file, "const label = t('undefined.key');\n");

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:1: "undefined.key" is not defined in en, uk`);
    expect(result.status).toBe(1);
  });

  it('fails for a namespaced key-shaped literal held in a constant', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'error-key.ts');
    writeText(file, "const UNKNOWN_KEY = 'greeting.unknown';\nexport default UNKNOWN_KEY;\n");

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:1: "greeting.unknown" is not defined in en, uk`);
    expect(result.status).toBe(1);
  });

  it('ignores a dynamic t(variable) call site', () => {
    const fixture = cleanFixture();
    writeText(sourceFile(fixture, 'render.ts'), 'export const render = (t, key) => t(key);\n');

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('resolves a key held in a template literal with no substitution', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'template.ts');
    writeText(file, 'export const label = (t) => t(`greeting.unknown`);\n');

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:1: "greeting.unknown" is not defined in en, uk`);
    expect(result.status).toBe(1);
  });

  it('ignores an interpolated template-literal key', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'interpolated.ts'),
      'export const label = (t, name) => t(`greeting.${name}`);\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails when a translation is present but blank in one locale', () => {
    const fixture = createFixture();
    const uk = { greeting: { hello: 'Привіт', bye: '   ' } };
    const dir = seedCatalog(fixture, 'greeting-feature', EN_CATALOG, uk);
    seedMerged(fixture, mergedFrom(EN_CATALOG, uk));

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${path.join(dir, 'uk.json')}: keys hold no usable text`);
    expect(result.stderr).toContain('greeting.bye');
    expect(result.status).toBe(1);
  });

  it('fails when a source translation file is parked in the generated output directory', () => {
    const fixture = cleanFixture();
    writeJson(path.join(fixture.outputDir, 'en.json'), { stray: 'Stray' });

    const result = runGate(fixture);

    expect(result.stderr).toContain(
      `${fixture.outputDir} may hold only localization.json, found en.json`
    );
    expect(result.status).toBe(1);
  });

  it('rewrites a stale merged catalog in --write mode and exits 0', () => {
    const fixture = createFixture();
    seedCatalog(fixture, 'greeting-feature', EN_CATALOG, UK_CATALOG);
    seedMerged(fixture, mergedFrom({ greeting: { hello: 'Hello' } }, UK_CATALOG));

    const result = runGate(fixture, ['--write']);

    expect(result.stdout).toContain(`wrote ${fixture.mergedPath}`);
    expect(JSON.parse(fs.readFileSync(fixture.mergedPath, 'utf8'))).toEqual(
      mergedFrom(EN_CATALOG, UK_CATALOG)
    );
    expect(result.status).toBe(0);
  });

  it('accepts a CLDR plural family whose locales use different categories', () => {
    const fixture = createFixture();
    const en = {
      greeting: {
        hello: 'Hello',
        bye: 'Bye',
        attempts_one: 'One left',
        attempts_other: 'Some left',
      },
    };
    const uk = {
      greeting: {
        hello: 'Привіт',
        bye: 'Бувай',
        attempts_one: 'Залишилась одна',
        attempts_few: 'Залишилось кілька',
        attempts_many: 'Залишилось багато',
        attempts_other: 'Залишилось',
      },
    };
    seedCatalog(fixture, 'greeting-feature', en, uk);
    seedMerged(fixture, mergedFrom(en, uk));
    writeText(sourceFile(fixture, 'plural.tsx'), "const label = t('greeting.attempts');\n");

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores a key name that only appears inside a comment', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'docs.ts'),
      [
        '/**',
        ' * The legacy `greeting.removed` key became `greeting.hello`.',
        ' */',
        'export const DOC_ONLY = 1;',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores a dotted literal that is not bound to a key-shaped name', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'telemetry.ts'),
      "export const crumb = { category: 'greeting.missing', level: 'info' };\n"
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores a dotted literal a bare carriage return separated from a key-named binding', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'split-binding.ts'),
      "declare const errorKey: LabelKey\rexport const crumb = 'greeting.missing';\r"
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores a namespace-qualified key it cannot resolve', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'namespaced.ts'),
      "export const label = (t) => t('translation:greeting.hello');\n"
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails when two catalogs claim ownership of the same key', () => {
    const fixture = cleanFixture();
    seedCatalog(
      fixture,
      'other-feature',
      { greeting: { hello: 'Hi' } },
      { greeting: { hello: 'Вітаю' } }
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('[key-ownership]');
    expect(result.stderr).toContain('"greeting.hello" is defined by 2 catalogs');
    expect(result.status).toBe(1);
  });

  it('reports two eager catalogs that disagree on whether a key is an object', () => {
    const fixture = cleanFixture();
    const dir = seedCatalog(
      fixture,
      'other-feature',
      { greeting: { bye: { soon: 'See you' } } },
      { greeting: { bye: { soon: 'До зустрічі' } } }
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(
      `[key-prefix] "greeting.bye" is a translation in ` +
        `${path.join(fixture.scanRoot, 'greeting-feature', 'i18n')} but an object holding ` +
        `"greeting.bye.soon" in ${dir}`
    );
    expect(result.stderr).not.toContain('TypeError');
    expect(result.status).toBe(1);
  });

  it('fails instead of passing vacuously when no catalog folder exists', () => {
    const fixture = createFixture();
    seedMerged(fixture, mergedFrom({}, {}));

    const result = runGate(fixture);

    expect(result.stderr).toContain('[no-coverage]');
    expect(result.status).toBe(1);
  });

  it('refuses to write a merged catalog built from an unparseable locale file', () => {
    const fixture = cleanFixture();
    const before = fs.readFileSync(fixture.mergedPath, 'utf8');
    writeText(
      path.join(fixture.scanRoot, 'greeting-feature', 'i18n', 'uk.json'),
      '{ "greeting": {'
    );

    const result = runGate(fixture, ['--write']);

    expect(result.stderr).toContain('refusing to write');
    expect(fs.readFileSync(fixture.mergedPath, 'utf8')).toBe(before);
    expect(result.status).toBe(1);
  });

  it('writes the merged catalog with the trailing newline the Prettier gate requires', () => {
    const fixture = createFixture();
    seedCatalog(fixture, 'greeting-feature', EN_CATALOG, UK_CATALOG);
    writeText(fixture.mergedPath, '{}');

    const result = runGate(fixture, ['--write']);

    expect(fs.readFileSync(fixture.mergedPath, 'utf8').endsWith('}\n')).toBe(true);
    expect(result.status).toBe(0);
  });

  it('fails when a locale file repeats a nested translation key', () => {
    const fixture = cleanFixture();
    const file = path.join(fixture.scanRoot, 'greeting-feature', 'i18n', 'uk.json');
    writeText(
      file,
      [
        '{',
        '  "greeting": {',
        '    "hello": "Привіт",',
        '    "bye": "Бувай",',
        '    "hello": "Вітаю"',
        '  }',
        '}',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}: keys are defined twice`);
    expect(result.stderr).toContain('greeting.hello');
    expect(result.status).toBe(1);
  });

  it('fails when the committed merged catalog repeats a key', () => {
    const fixture = cleanFixture();
    writeText(
      fixture.mergedPath,
      [
        '{',
        '  "en": { "translation": { "a": "1", "a": "2" } },',
        '  "uk": { "translation": { "a": "1" } }',
        '}',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('keys are defined twice');
    expect(result.status).toBe(1);
  });

  it('accepts the same key name reused in sibling objects', () => {
    const fixture = createFixture();
    const en = { greeting: { hello: 'Hello' }, farewell: { hello: 'Bye' } };
    const uk = { greeting: { hello: 'Привіт' }, farewell: { hello: 'Бувай' } };
    seedCatalog(fixture, 'greeting-feature', en, uk);
    seedMerged(fixture, mergedFrom(en, uk));

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores a key name that only appears inside unrelated prose', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'prose.ts'),
      'export const doc = "call t(\'greeting.missing\') somewhere";\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key referenced inside a template-literal interpolation', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'title.ts'),
      "export const title = (t) => `${t('greeting.missing')} - VilnaCRM`;\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('still ignores a key name written in template-literal prose', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'template-prose.ts'),
      "export const doc = (n) => `legacy t('greeting.missing') dropped in ${n}`;\n"
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key referenced after a regex literal holding a quote', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'quoted-regex.ts'),
      "export const label = (t) => (/['\"]/.test('x') ? t('greeting.missing') : '');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('fails for a key referenced after a regex that follows a control-flow parenthesis', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'control-regex.ts'),
      "export const f = (t, s) => { if (s) /['\"]/.test(s); return t('greeting.missing'); };\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('ignores prose reached past an unflagged regex literal and a division', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'unflagged-regex.ts'),
      'export const odd = /a/ / 2, doc = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key referenced after a division on the same line', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'division.ts'),
      "export const label = (t, a, b) => (a / b > 1 ? t('greeting.missing') : '');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('ignores prose reached past a member call named like a control keyword', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'member-call.ts'),
      'export const o = p.catch(f) / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a member named like an expression keyword', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'member-name.ts'),
      'export const o = it.return / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a postfix increment and a division', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'postfix.ts'),
      'let i = 0;\nexport const o = i++ / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a spaced postfix increment and a division', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'spaced-postfix.ts'),
      'let i = 0;\nexport const o = i ++ / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a non-ASCII identifier and a division', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'unicode-identifier.ts'),
      'export const кількість = 4;\n' +
        'export const o = кількість / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past an astral-plane identifier and a division', () => {
    const fixture = cleanFixture();
    const name = '\u{1D434}';
    writeText(
      sourceFile(fixture, 'astral-identifier.ts'),
      `export const ${name} = 4;\n` +
        `export const o = ${name} / 2, d = "call t('greeting.missing') here" / 2;\n`
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a private member named like an expression keyword', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'private-member.ts'),
      [
        'export class Ratio {',
        '  #default = 4;',
        '',
        '  value = this.#default / 2 + "call t(\'greeting.missing\') here".length / 2;',
        '}',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a non-null assertion and a division', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'non-null.ts'),
      'export const o = total! / 2, d = "call t(\'greeting.missing\') here" / 2;\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key referenced after a regex a prefix negation introduced', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'negated-regex.ts'),
      "export const label = (t, s) => (!/['\"]/.test(s) ? t('greeting.missing') : '');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('ignores prose reached past a JSX spread attribute and a self-closing tag', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'spread-attribute.tsx'),
      [
        'export const Row = () => (',
        '  <div>',
        '    <Icon {...iconProps} /> <span title="write t(\'greeting.missing\') here" />',
        '  </div>',
        ');',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('ignores prose reached past a regex candidate a backslash cannot continue', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'escaped-break.ts'),
      [
        'export const f = () => {',
        '  return /^a\\',
        '  "call t(\'greeting.missing\') here" / 2;',
        '};',
        '',
      ].join('\n')
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('reports the real line for a key a bare carriage return moved down the file', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'carriage-return-lines.ts');
    writeText(
      file,
      "// legacy note\r/* block\rcomment */\rexport const s = t('greeting.missing');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:4:`);
    expect(result.status).toBe(1);
  });

  it('counts a CRLF pair as one line when reporting a key', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'crlf-lines.ts');
    writeText(
      file,
      [
        '// legacy note',
        '/* block',
        'comment */',
        "export const s = t('greeting.missing');",
        '',
      ].join('\r\n')
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:4:`);
    expect(result.status).toBe(1);
  });

  it('ignores prose continued onto the next line by a CRLF escape', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'continuation.ts'),
      'export const d = "prefix \\\r\ncall t(\'greeting.missing\') here";\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key in a JSX element that follows a closing tag on the same line', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'closing-tag.tsx');
    writeText(
      file,
      'export const Legal = () => (\n' +
        '  <a href="/terms">terms</a> <a href="/privacy">{t(\'greeting.missing\')}</a>\n' +
        ');\n'
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:2: "greeting.missing"`);
    expect(result.status).toBe(1);
  });

  it('ignores a key that only appears inside a JSX comment', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'jsx-comment.tsx'),
      'export const Row = () => (\n' +
        "  <b>{t('greeting.hello')}</b> {/* <span>{t('greeting.removed')}</span> */}\n" +
        ');\n'
    );

    const result = runGate(fixture);

    expect(result.stdout).toContain('check-i18n-parity: OK');
    expect(result.status).toBe(0);
  });

  it('fails for a key on a line whose JSX prose holds a bare URL', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'jsx-url.tsx');
    writeText(
      file,
      'export const Note = () => (\n' +
        "  <p>See https://vilna.crm for details. {t('greeting.missing')}</p>\n" +
        ');\n'
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:2: "greeting.missing"`);
    expect(result.status).toBe(1);
  });

  it('fails for a key referenced after a regex that opens a statement', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'statement-regex.ts'),
      'export const f = (t, x) => {\n' +
        '  if (x) { g(); }\n' +
        "  /['\"]/.test(x) ? t('greeting.missing') : '';\n" +
        '};\n'
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('fails for a key reached through an optional-chained i18next instance', () => {
    const fixture = cleanFixture();
    const file = sourceFile(fixture, 'optional-chain.ts');
    writeText(file, "export const label = (i18n) => i18n?.t('greeting.missing');\n");

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}:1: "greeting.missing"`);
    expect(result.status).toBe(1);
  });

  it('fails for a key referenced after a regex introduced by default', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'default-regex.ts'),
      "export default /['\"]/.source + t('greeting.missing');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.status).toBe(1);
  });

  it('fails for a key on a line a bare carriage return separated from a comment', () => {
    const fixture = cleanFixture();
    writeText(
      sourceFile(fixture, 'carriage-return.ts'),
      "// legacy t('greeting.gone')\rexport const s = t('greeting.missing');\n"
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain('greeting.missing');
    expect(result.stderr).not.toContain('greeting.gone');
    expect(result.status).toBe(1);
  });

  it('fails when a key is repeated behind a different JSON escape', () => {
    const fixture = cleanFixture();
    const file = path.join(fixture.scanRoot, 'greeting-feature', 'i18n', 'uk.json');
    writeText(
      file,
      '{\n  "greeting": {\n    "hello": "Привіт",\n    "h\\u0065llo": "Вітаю"\n  }\n}\n'
    );

    const result = runGate(fixture);

    expect(result.stderr).toContain(`${file}: keys are defined twice`);
    expect(result.stderr).toContain('greeting.hello');
    expect(result.status).toBe(1);
  });

  it('rejects a stray locale file in the canonical directory under a custom output dir', () => {
    const fixture = cleanFixture();
    const customOutput = path.join(fixture.scanRoot, '..', 'generated');
    fs.mkdirSync(customOutput, { recursive: true });
    fs.copyFileSync(fixture.mergedPath, path.join(customOutput, 'localization.json'));
    writeJson(path.join(fixture.outputDir, 'en.json'), { stray: 'Stray' });

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        I18N_SCAN_ROOT: fixture.scanRoot,
        I18N_OUTPUT_DIR: customOutput,
        I18N_CATALOG_POLICY: fixture.policyPath,
      },
    });

    expect(result.stderr).toContain('may hold only localization.json, found en.json');
    expect(result.status).toBe(1);
  });

  it('prints usage and exits 2 for an unknown argument', () => {
    const result = runGate(cleanFixture(), ['--bogus']);

    expect(result.stderr).toContain('Usage: node scripts/ci/check-i18n-parity.mjs [--write]');
    expect(result.status).toBe(2);
  });

  describe('lazy catalogs', () => {
    const LAZY_EN = { recovery: { title: 'Recover', back: 'Back' } };
    const LAZY_UK = { recovery: { title: 'Відновлення', back: 'Назад' } };
    const LAZY_FOLDER = path.join('recovery-route', 'i18n');
    const LAZY_ENTRY = { catalog: LAZY_FOLDER, owners: ['recovery-route'] };

    const lazyFixture = (entry = LAZY_ENTRY) => {
      const fixture = cleanFixture();
      const dir = seedCatalog(fixture, 'recovery-route', LAZY_EN, LAZY_UK);
      declareLazy(fixture, [entry]);
      return { fixture, dir };
    };

    const ownedFile = (fixture, name) => path.join(fixture.scanRoot, 'recovery-route', name);

    it('keeps a declared lazy catalog out of the merged catalog yet resolves its keys', () => {
      const { fixture } = lazyFixture();
      writeText(
        ownedFile(fixture, 'recovery.tsx'),
        "const titleKey = 'recovery.title';\nconst back = t('recovery.back');\n"
      );

      const result = runGate(fixture);

      expect(result.stdout).toContain('check-i18n-parity: OK — 2 catalog folder(s) (1 lazy)');
      expect(result.stdout).toContain('2 merged key(s) per locale, 2 translation reference(s)');
      expect(result.status).toBe(0);
    });

    it('merges an undeclared catalog eagerly, so the same tree reports a stale merge', () => {
      const fixture = cleanFixture();
      seedCatalog(fixture, 'recovery-route', LAZY_EN, LAZY_UK);

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${fixture.mergedPath} is stale`);
      expect(result.stderr).toContain('en.translation.recovery.title');
      expect(result.status).toBe(1);
    });

    it('fails when the committed merged catalog carries a lazy catalog key', () => {
      const { fixture } = lazyFixture();
      seedMerged(fixture, mergedFrom({ ...EN_CATALOG, ...LAZY_EN }, { ...UK_CATALOG, ...LAZY_UK }));

      const result = runGate(fixture);

      expect(result.stderr).toContain('no longer produced by any catalog');
      expect(result.stderr).toContain('uk.translation.recovery.back');
      expect(result.status).toBe(1);
    });

    it('writes a merged catalog without the lazy catalog keys', () => {
      const { fixture } = lazyFixture();
      writeText(fixture.mergedPath, '{}');

      const result = runGate(fixture, ['--write']);

      expect(JSON.parse(fs.readFileSync(fixture.mergedPath, 'utf8'))).toEqual(
        mergedFrom(EN_CATALOG, UK_CATALOG)
      );
      expect(result.status).toBe(0);
    });

    it('fails when a lazy catalog loses en/uk parity', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'uk.json'), { recovery: { title: 'Відновлення' } });

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${dir}: en/uk key sets differ`);
      expect(result.stderr).toContain('recovery.back');
      expect(result.status).toBe(1);
    });

    it('fails when a lazy catalog key is held blank', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'en.json'), { recovery: { title: ' ', back: 'Back' } });

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${path.join(dir, 'en.json')}: keys hold no usable text`);
      expect(result.status).toBe(1);
    });

    it('fails for a t() call on a key the lazy catalog does not define', () => {
      const { fixture } = lazyFixture();
      const file = ownedFile(fixture, 'recovery.tsx');
      writeText(file, "const label = t('recovery.missing');\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${file}:1: "recovery.missing" is not defined in en, uk`);
      expect(result.status).toBe(1);
    });

    it('fails for a *Key binding in a lazy namespace that the lazy catalog does not define', () => {
      const { fixture } = lazyFixture();
      const file = ownedFile(fixture, 'route.ts');
      writeText(file, "export const meta = { titleKey: 'recovery.subtitle' };\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${file}:1: "recovery.subtitle" is not defined in en, uk`);
      expect(result.status).toBe(1);
    });

    it('fails for a key defined only in one locale of the lazy catalog', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'en.json'), { recovery: { ...LAZY_EN.recovery, hint: 'Hint' } });
      const file = ownedFile(fixture, 'recovery.tsx');
      writeText(file, "const hint = t('recovery.hint');\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(`${file}:1: "recovery.hint" is not defined in uk`);
      expect(result.status).toBe(1);
    });

    it('fails when a lazy catalog claims a key an eager catalog already owns', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'en.json'), { ...LAZY_EN, greeting: { hello: 'Hi' } });
      writeJson(path.join(dir, 'uk.json'), { ...LAZY_UK, greeting: { hello: 'Привіт' } });

      const result = runGate(fixture);

      expect(result.stderr).toContain('[key-ownership] "greeting.hello" is defined by 2 catalogs');
      expect(result.status).toBe(1);
    });

    it('reports a lazy object nested under an eager translation instead of crashing', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'en.json'), { ...LAZY_EN, greeting: { hello: { more: 'More' } } });
      writeJson(path.join(dir, 'uk.json'), { ...LAZY_UK, greeting: { hello: { more: 'Ще' } } });
      const eagerDir = path.join(fixture.scanRoot, 'greeting-feature', 'i18n');

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[key-prefix] "greeting.hello" is a translation in ${eagerDir} but an object holding ` +
          `"greeting.hello.more" in ${dir}`
      );
      expect(result.stderr).not.toContain('TypeError');
      expect(result.status).toBe(1);
    });

    it('reports a lazy translation that replaces an eager object', () => {
      const { fixture, dir } = lazyFixture();
      writeJson(path.join(dir, 'en.json'), { ...LAZY_EN, greeting: 'Greeting' });
      writeJson(path.join(dir, 'uk.json'), { ...LAZY_UK, greeting: 'Вітання' });
      writeText(ownedFile(fixture, 'recovery.tsx'), "const hello = t('greeting.hello');\n");
      const eagerDir = path.join(fixture.scanRoot, 'greeting-feature', 'i18n');

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[key-prefix] "greeting" is a translation in ${dir} but an object holding ` +
          `"greeting.bye", "greeting.hello" in ${eagerDir}`
      );
      expect(result.stderr).not.toContain('[undefined-key]');
      expect(result.status).toBe(1);
    });

    it('fails for a t() call in an eager file on a key only a lazy catalog defines', () => {
      const { fixture, dir } = lazyFixture();
      const file = sourceFile(fixture, 'panel.tsx');
      writeText(file, "const title = t('recovery.title');\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[lazy-key-scope] ${file}:1: "recovery.title" is defined only in the lazy catalog ` +
          `${dir}, and ${fixture.policyPath} does not list this file among its owners`
      );
      expect(result.stderr).not.toContain('[undefined-key]');
      expect(result.status).toBe(1);
    });

    it('fails for a *Key binding in an eager file naming a lazy-only key', () => {
      const { fixture, dir } = lazyFixture();
      const file = sourceFile(fixture, 'route.ts');
      writeText(file, "export const meta = { titleKey: 'recovery.title' };\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[lazy-key-scope] ${file}:1: "recovery.title" is defined only in the lazy catalog ${dir}`
      );
      expect(result.status).toBe(1);
    });

    it('does not let an owner folder cover a sibling folder that shares its name prefix', () => {
      const { fixture } = lazyFixture();
      const file = path.join(fixture.scanRoot, 'recovery-route-extra', 'panel.tsx');
      writeText(file, "const back = t('recovery.back');\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain(`[lazy-key-scope] ${file}:1: "recovery.back"`);
      expect(result.status).toBe(1);
    });

    it('resolves a lazy key from an owner listed as a single file, and only from that file', () => {
      const { fixture } = lazyFixture({
        catalog: LAZY_FOLDER,
        owners: [path.join('greeting-feature', 'routes.ts')],
      });
      writeText(
        sourceFile(fixture, 'routes.ts'),
        "export const meta = { titleKey: 'recovery.title' };\n"
      );
      const sibling = sourceFile(fixture, 'page.tsx');
      writeText(sibling, "const back = t('recovery.back');\n");

      const result = runGate(fixture);

      expect(result.stderr).toContain('1 violation(s) found');
      expect(result.stderr).toContain(`[lazy-key-scope] ${sibling}:1: "recovery.back"`);
      expect(result.stderr).not.toContain('routes.ts');
      expect(result.status).toBe(1);
    });

    it('keeps resolving eager keys from a lazy owner file', () => {
      const { fixture } = lazyFixture();
      writeText(
        ownedFile(fixture, 'recovery.tsx'),
        "const hello = t('greeting.hello');\nconst back = t('recovery.back');\n"
      );

      const result = runGate(fixture);

      expect(result.stdout).toContain('2 translation reference(s)');
      expect(result.status).toBe(0);
    });

    it('fails when the policy names an owner path that does not exist', () => {
      const { fixture } = lazyFixture({
        catalog: LAZY_FOLDER,
        owners: ['recovery-route', 'gone-route/page.tsx'],
      });

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[lazy-catalog] ${fixture.policyPath} lists "gone-route/page.tsx" as an owner of ` +
          `"${LAZY_FOLDER}", but no file or folder exists there under ${fixture.scanRoot}`
      );
      expect(result.status).toBe(1);
    });

    it('fails when the policy declares a lazy catalog folder that does not exist', () => {
      const fixture = cleanFixture();
      declareLazy(fixture, [{ catalog: 'gone-route/i18n', owners: ['greeting-feature'] }]);

      const result = runGate(fixture);

      expect(result.stderr).toContain(
        `[lazy-catalog] ${fixture.policyPath} declares "gone-route/i18n", but no ` +
          `i18n/ catalog folder exists there under ${fixture.scanRoot}`
      );
      expect(result.status).toBe(1);
    });

    it.each([
      ['a missing lazyCatalogs list', {}],
      ['a non-array lazyCatalogs value', { lazyCatalogs: 'recovery-route/i18n' }],
      ['a bare folder string without owners', { lazyCatalogs: ['recovery-route/i18n'] }],
      ['a blank catalog folder', { lazyCatalogs: [{ catalog: '  ', owners: ['a'] }] }],
      ['a non-string catalog folder', { lazyCatalogs: [{ catalog: 7, owners: ['a'] }] }],
      ['a missing owners list', { lazyCatalogs: [{ catalog: 'r/i18n' }] }],
      ['a non-array owners value', { lazyCatalogs: [{ catalog: 'r/i18n', owners: 'r' }] }],
      ['an empty owners list', { lazyCatalogs: [{ catalog: 'r/i18n', owners: [] }] }],
      ['a blank owner', { lazyCatalogs: [{ catalog: 'r/i18n', owners: ['r', ' '] }] }],
      ['a non-string owner', { lazyCatalogs: [{ catalog: 'r/i18n', owners: [7] }] }],
      ['a policy that is not an object', [LAZY_ENTRY]],
    ])('exits 1 for a catalog policy with %s', (_label, policy) => {
      const fixture = cleanFixture();
      writeJson(fixture.policyPath, policy);

      const result = runGate(fixture);

      expect(result.stderr).toBe(
        `check-i18n-parity: catalog policy ${fixture.policyPath} must declare "lazyCatalogs" ` +
          'as an array of { "catalog": <folder>, "owners": [<file or folder>, ...] } entries\n'
      );
      expect(result.status).toBe(1);
    });

    it('exits 1 when the catalog policy file cannot be parsed', () => {
      const fixture = cleanFixture();
      writeText(fixture.policyPath, '{ "lazyCatalogs": [');

      const result = runGate(fixture);

      expect(result.stderr).toContain(`cannot read catalog policy ${fixture.policyPath} — `);
      expect(result.status).toBe(1);
    });

    describe('the repository policy', () => {
      const repositoryPolicy = JSON.parse(
        fs.readFileSync(path.join(repoRoot, 'config', 'i18n-catalog-policy.json'), 'utf8')
      );
      const SETTINGS_CATALOG = path.join('modules', 'user', 'features', 'settings', 'i18n');
      const SETTINGS_FEATURE = path.join('modules', 'user', 'features', 'settings');

      const isFileOwner = (owner) => /\.tsx?$/.test(owner);

      const repositoryTree = () => {
        const fixture = cleanFixture();
        repositoryPolicy.lazyCatalogs.forEach(({ catalog, owners }, index) => {
          const keys = catalog === SETTINGS_CATALOG ? { settings: { title: 'Settings' } } : {};
          const own = { [`lazy_${index}`]: { label: `Label ${index}` }, ...keys };
          writeJson(path.join(fixture.scanRoot, catalog, 'en.json'), own);
          writeJson(path.join(fixture.scanRoot, catalog, 'uk.json'), own);
          owners.forEach((owner) => {
            const target = path.join(fixture.scanRoot, owner);
            if (isFileOwner(owner)) writeText(target, 'export {};\n');
            else fs.mkdirSync(target, { recursive: true });
          });
        });
        writeJson(fixture.policyPath, repositoryPolicy);
        return fixture;
      };

      const settingsKeyIn = (fixture, file) => {
        const target = path.join(fixture.scanRoot, SETTINGS_FEATURE, file);
        writeText(target, "const title = t('settings.title');\n");
        return target;
      };

      it.each([
        path.join('components', 'user-menu', 'user-chip.tsx'),
        path.join('components', 'user-menu', 'current-user-menu.tsx'),
        path.join('hooks', 'use-current-user.ts'),
        path.join('hooks', 'use-user-menu.ts'),
        path.join('hooks', 'use-user-menu-keys.ts'),
        path.join('hooks', 'use-chip-label.ts'),
        path.join('hooks', 'use-chip-name-growth.ts'),
      ])('fails for a settings key used from the shell file %s', (file) => {
        const fixture = repositoryTree();
        const target = settingsKeyIn(fixture, file);

        const result = runGate(fixture);

        expect(result.stderr).toContain(`[lazy-key-scope] ${target}:1: "settings.title"`);
        expect(result.status).toBe(1);
      });

      it.each([
        path.join('routes', 'user-profile', 'index.tsx'),
        path.join('components', 'profile-form', 'index.tsx'),
        path.join('components', 'user-profile-settings', 'index.tsx'),
        path.join('hooks', 'use-profile-save.ts'),
      ])('resolves a settings key from the settings page file %s', (file) => {
        const fixture = repositoryTree();
        settingsKeyIn(fixture, file);

        const result = runGate(fixture);

        expect(result.stderr).toBe('');
        expect(result.status).toBe(0);
      });
    });

    it('reads the repository policy when I18N_CATALOG_POLICY is unset', () => {
      const fixture = cleanFixture();
      const env = { ...process.env, I18N_SCAN_ROOT: fixture.scanRoot };
      delete env.I18N_CATALOG_POLICY;

      const result = spawnSync(process.execPath, [scriptPath], {
        cwd: repoRoot,
        encoding: 'utf8',
        env,
      });

      expect(result.stderr).toContain(
        '[lazy-catalog] config/i18n-catalog-policy.json declares ' +
          '"modules/user/features/auth/routes/recovery-catalog/i18n"'
      );
      expect(result.status).toBe(1);
    });
  });
});
