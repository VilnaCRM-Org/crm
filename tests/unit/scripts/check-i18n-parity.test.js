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

  it('prints usage and exits 2 for an unknown argument', () => {
    const result = runGate(cleanFixture(), ['--bogus']);

    expect(result.stderr).toContain('Usage: node scripts/ci/check-i18n-parity.mjs [--write]');
    expect(result.status).toBe(2);
  });
});
