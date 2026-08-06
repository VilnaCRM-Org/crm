// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import useFeatureFlag from '@/hooks/use-feature-flag';
import accessState from '@/lib/access/access-state';
import { FEATURE_FLAG_DEFAULTS, FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import type { FeatureFlag, FeatureFlagState } from '@/lib/types/access/feature-flag';
import { buildPrincipal } from '@tests/builders';

function renderFlag(flag: FeatureFlag): boolean {
  return renderHook(() => useFeatureFlag(flag)).result.current;
}

function seedFlags(flags: FeatureFlagState): void {
  accessState.setSession(buildPrincipal(), flags);
}

describe('useFeatureFlag', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('falls back to the catalog default while anonymous', () => {
    expect(renderFlag(FEATURE_FLAGS.contactsModule)).toBe(false);
    expect(renderFlag(FEATURE_FLAGS.dealsModule)).toBe(false);
    expect(renderFlag(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
  });

  it('falls back to the catalog default when the session carries no override', () => {
    seedFlags({});

    expect(renderFlag(FEATURE_FLAGS.contactsModule)).toBe(false);
    expect(renderFlag(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
  });

  it('honours an override that turns a default-off flag on', () => {
    expect(FEATURE_FLAG_DEFAULTS[FEATURE_FLAGS.contactsModule]).toBe(false);
    seedFlags({ [FEATURE_FLAGS.contactsModule]: true });

    expect(renderFlag(FEATURE_FLAGS.contactsModule)).toBe(true);
  });

  it('honours an override that turns a default-on flag off', () => {
    expect(FEATURE_FLAG_DEFAULTS[FEATURE_FLAGS.tenantSwitcher]).toBe(true);
    seedFlags({ [FEATURE_FLAGS.tenantSwitcher]: false });

    expect(renderFlag(FEATURE_FLAGS.tenantSwitcher)).toBe(false);
  });

  it('reads each flag independently and leaves the others on their default', () => {
    seedFlags({ [FEATURE_FLAGS.dealsModule]: true, [FEATURE_FLAGS.tenantSwitcher]: false });

    expect(renderFlag(FEATURE_FLAGS.dealsModule)).toBe(true);
    expect(renderFlag(FEATURE_FLAGS.tenantSwitcher)).toBe(false);
    expect(renderFlag(FEATURE_FLAGS.contactsModule)).toBe(false);
  });

  it('re-evaluates the flag for a new session on the next render', () => {
    seedFlags({ [FEATURE_FLAGS.contactsModule]: true });
    const { result, rerender } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.contactsModule));
    expect(result.current).toBe(true);

    accessState.clear();
    rerender();

    expect(result.current).toBe(false);
  });
});
