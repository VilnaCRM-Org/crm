import type { FeatureFlag } from '@/lib/types/access/feature-flag';
import loadIsolated from '@tests/unit/utils/isolated-module';

type FeatureFlagCatalog = typeof import('@/lib/access/feature-flag-catalog');

const EVERY_FLAG: Readonly<Record<FeatureFlag, true>> = {
  'contacts-module': true,
  'deals-module': true,
  'tenant-switcher': true,
};

const UNION_FLAGS = Object.keys(EVERY_FLAG) as FeatureFlag[];

const sorted = (values: readonly string[]): string[] => [...values].sort();

/**
 * Both catalogues are frozen top-level literals evaluated at module load, so they are loaded
 * inside the test body rather than imported at the top: a mutant in such a literal is otherwise
 * credited to whichever unrelated suite imported the module first and comes back unscored.
 *
 * The flag names and their shipped defaults are a fixed contract, so the literals ARE the test
 * case — pinned values, not Faker.
 */
const loadCatalog = (): Promise<FeatureFlagCatalog> =>
  loadIsolated(() => import('@/lib/access/feature-flag-catalog'));

describe('feature flag catalog', () => {
  describe('FEATURE_FLAGS', () => {
    it('maps every camelCase key to its wire flag name', async () => {
      const { FEATURE_FLAGS } = await loadCatalog();

      expect(FEATURE_FLAGS).toEqual({
        contactsModule: 'contacts-module',
        dealsModule: 'deals-module',
        tenantSwitcher: 'tenant-switcher',
      });
    });

    it('catalogues every member of the FeatureFlag union exactly once', async () => {
      const { FEATURE_FLAGS } = await loadCatalog();
      const catalogued = Object.values(FEATURE_FLAGS);

      expect(sorted(catalogued)).toEqual(sorted(UNION_FLAGS));
      expect(catalogued).toHaveLength(3);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('FEATURE_FLAG_DEFAULTS', () => {
    it('ships the module flags off and the tenant switcher on', async () => {
      const { FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(FEATURE_FLAG_DEFAULTS).toEqual({
        'contacts-module': false,
        'deals-module': false,
        'tenant-switcher': true,
      });
    });

    it('defaults contacts-module to false, so the module ships dark', async () => {
      const { FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(FEATURE_FLAG_DEFAULTS['contacts-module']).toBe(false);
    });

    it('defaults deals-module to false, so the module ships dark', async () => {
      const { FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(FEATURE_FLAG_DEFAULTS['deals-module']).toBe(false);
    });

    it('defaults tenant-switcher to true, so tenancy is available without a rollout', async () => {
      const { FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(FEATURE_FLAG_DEFAULTS['tenant-switcher']).toBe(true);
    });

    it('declares a default for every catalogued flag and no extra keys', async () => {
      const { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(sorted(Object.keys(FEATURE_FLAG_DEFAULTS))).toEqual(
        sorted(Object.values(FEATURE_FLAGS))
      );
    });
  });

  describe('immutability', () => {
    it('freezes the catalogue and the defaults', async () => {
      const { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(Object.isFrozen(FEATURE_FLAGS)).toBe(true);
      expect(Object.isFrozen(FEATURE_FLAG_DEFAULTS)).toBe(true);
    });

    it('rejects a runtime write to the defaults', async () => {
      const { FEATURE_FLAG_DEFAULTS } = await loadCatalog();

      expect(() => Object.assign(FEATURE_FLAG_DEFAULTS, { 'contacts-module': true })).toThrow(
        TypeError
      );
      expect(FEATURE_FLAG_DEFAULTS['contacts-module']).toBe(false);
    });
  });
});
