import { FEATURE_FLAG_DEFAULTS, FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';

const EVERY_FLAG: Readonly<Record<FeatureFlag, true>> = {
  'contacts-module': true,
  'deals-module': true,
  'tenant-switcher': true,
};

const UNION_FLAGS = Object.keys(EVERY_FLAG) as FeatureFlag[];

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe('feature flag catalog', () => {
  describe('FEATURE_FLAGS', () => {
    it('maps every camelCase key to its wire flag name', () => {
      expect(FEATURE_FLAGS).toEqual({
        contactsModule: 'contacts-module',
        dealsModule: 'deals-module',
        tenantSwitcher: 'tenant-switcher',
      });
    });

    it('catalogues every member of the FeatureFlag union exactly once', () => {
      const catalogued = Object.values(FEATURE_FLAGS);

      expect(sorted(catalogued)).toEqual(sorted(UNION_FLAGS));
      expect(catalogued).toHaveLength(3);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('FEATURE_FLAG_DEFAULTS', () => {
    it('ships the module flags off and the tenant switcher on', () => {
      expect(FEATURE_FLAG_DEFAULTS).toEqual({
        'contacts-module': false,
        'deals-module': false,
        'tenant-switcher': true,
      });
    });

    it.each([
      ['contacts-module', false],
      ['deals-module', false],
      ['tenant-switcher', true],
    ] as const)('defaults %s to %p', (flag, expected) => {
      expect(FEATURE_FLAG_DEFAULTS[flag]).toBe(expected);
    });

    it('declares a default for every catalogued flag and no extra keys', () => {
      expect(sorted(Object.keys(FEATURE_FLAG_DEFAULTS))).toEqual(
        sorted(Object.values(FEATURE_FLAGS))
      );
    });
  });

  describe('immutability', () => {
    it('freezes the catalogue and the defaults', () => {
      expect(Object.isFrozen(FEATURE_FLAGS)).toBe(true);
      expect(Object.isFrozen(FEATURE_FLAG_DEFAULTS)).toBe(true);
    });

    it('rejects a runtime write to the defaults', () => {
      expect(() => Object.assign(FEATURE_FLAG_DEFAULTS, { 'contacts-module': true })).toThrow(
        TypeError
      );
      expect(FEATURE_FLAG_DEFAULTS['contacts-module']).toBe(false);
    });
  });
});
