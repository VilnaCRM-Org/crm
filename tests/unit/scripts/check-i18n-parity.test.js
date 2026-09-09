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
  return { scanRoot, outputDir, mergedPath: path.join(outputDir, 'localization.json') };
};

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
});
