import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { ROLES } from '@/lib/access/permission-catalog';
import FeatureFlagService from '@/services/access/feature-flag-service';
import { buildPrincipal } from '@tests/builders';

describe('FeatureFlagService', () => {
  const service = new FeatureFlagService(accessCore);

  afterEach(() => {
    accessState.clear();
  });

  describe('without a session override', () => {
    it('falls back to the catalog default of an off-by-default flag', () => {
      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
      expect(service.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(false);
    });

    it('falls back to the catalog default of an on-by-default flag', () => {
      expect(service.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });

    it('still falls back to the defaults for a signed-in principal with no flags', () => {
      accessState.setSession(buildPrincipal({ roles: [ROLES.admin] }), {});

      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
      expect(service.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });
  });

  describe('with a session override', () => {
    it('turns an off-by-default flag on', () => {
      accessState.setSession(buildPrincipal(), { [FEATURE_FLAGS.contactsModule]: true });

      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);
    });

    it('turns an on-by-default flag off', () => {
      accessState.setSession(buildPrincipal(), { [FEATURE_FLAGS.tenantSwitcher]: false });

      expect(service.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(false);
    });

    it('only overrides the flags it names', () => {
      accessState.setSession(buildPrincipal(), { [FEATURE_FLAGS.dealsModule]: true });

      expect(service.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(true);
      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
      expect(service.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });

    it('drops back to the default once the session is cleared', () => {
      accessState.setSession(buildPrincipal(), { [FEATURE_FLAGS.contactsModule]: true });

      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);

      accessState.clear();

      expect(service.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
    });
  });
});
