import localization from '@/i18n/localization.json';
import { RECOVERIES } from '@/lib/reliability/recovery-strategy-detector';

type Catalog = Record<string, unknown>;

const LOCALES = ['en', 'uk'] as const;

const EMITTED_KEYS = [
  'error_boundary.retryable',
  'error_boundary.unrecoverable',
  'error_boundary.chunk_load',
  'error_boundary.route',
  'error_boundary.unexpected',
];

const resolveKey = (catalog: Catalog, key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        typeof node === 'object' && node !== null ? (node as Catalog)[segment] : undefined,
      catalog
    );

const translationOf = (locale: (typeof LOCALES)[number]): Catalog =>
  localization[locale].translation as Catalog;

/**
 * Every messageKey the detector can emit is rendered through `t()` by the error fallback, so a key
 * missing from either locale would paint the raw key. The assertion reads the merged catalog the
 * app ships rather than a per-feature source file, so it also fails when the merge is stale.
 */
describe('recovery message keys resolve in the merged catalog', () => {
  it('enumerates every messageKey the detector can emit', () => {
    const emitted = Object.values(RECOVERIES).map((recovery) => recovery.messageKey);

    expect(emitted).toEqual(EMITTED_KEYS);
  });

  it.each(LOCALES)('resolves every emitted messageKey to a non-empty %s string', (locale) => {
    const catalog = translationOf(locale);

    const unresolved = EMITTED_KEYS.filter((key) => {
      const value = resolveKey(catalog, key);

      return typeof value !== 'string' || value.trim() === '';
    });

    expect(unresolved).toEqual([]);
  });
});
