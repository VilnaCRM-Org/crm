import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../src/components/coming-soon');

const sourceFiles = (directory: string): readonly string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : [full];
  });

const read = (name: string): string => readFileSync(path.join(ROOT, name), 'utf8');

const CODE_FILES = sourceFiles(ROOT).filter((file) => /\.(ts|tsx)$/.test(file));
const RUNTIME_FILES = CODE_FILES.filter((file) => !file.includes('.stories.'));
const CYRILLIC_RUSSIAN_ONLY = /[ыэъёЫЭЪЁ]/;

describe('coming-soon source contract (issue #362)', () => {
  it('finds the page, link, sections, styles and barrel', () => {
    expect(RUNTIME_FILES.map((file) => path.relative(ROOT, file)).sort()).toEqual([
      'coming-soon-home-link.tsx',
      'coming-soon-page.tsx',
      'coming-soon-sections.ts',
      'index.ts',
      'styles.ts',
    ]);
  });

  it('imports nothing from src/modules, whichever alias it uses', () => {
    for (const file of CODE_FILES) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/from '(@\/modules|@auth)/);
    }
  });

  it('imports neither ErrorPageCard, ErrorPageActions nor ERROR_PAGE_VARIANTS values', () => {
    const page = read('coming-soon-page.tsx');
    const link = read('coming-soon-home-link.tsx');

    for (const source of [page, link]) {
      expect(source).not.toContain('error-page-card');
      expect(source).not.toContain('error-page-actions');
      expect(source).not.toMatch(/\bERROR_PAGE_VARIANTS\b/);
      expect(source).not.toContain('ErrorPageDigits');
    }
  });

  it('reuses the error-page action id and style builders for the home link', () => {
    const link = read('coming-soon-home-link.tsx');

    expect(link).toContain(
      "import { ERROR_PAGE_ACTIONS_ID } from '@/components/error-page/config/error-page-variants'"
    );
    expect(link).toContain("from '@/components/error-page/styles/action-styles'");
    expect(link).toContain('<Box id={ERROR_PAGE_ACTIONS_ID}');
    expect(link).toContain('useLinkClickHandler');
  });

  it('holds no Russian-only letters in any source or catalog file', () => {
    const catalogs = [path.join(ROOT, 'i18n', 'en.json'), path.join(ROOT, 'i18n', 'uk.json')];

    for (const file of [...CODE_FILES, ...catalogs]) {
      expect(readFileSync(file, 'utf8')).not.toMatch(CYRILLIC_RUSSIAN_ONLY);
    }
  });

  it('keeps the uk and en catalogs on the same coming_soon keys', () => {
    const parse = (locale: string): Record<string, unknown> =>
      JSON.parse(read(`i18n/${locale}.json`)) as Record<string, unknown>;
    const keys = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`))
        : [prefix];

    expect(keys(parse('uk'))).toEqual(keys(parse('en')));
  });
});
