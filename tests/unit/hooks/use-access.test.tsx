// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import useAccess from '@/hooks/use-access';
import accessState from '@/lib/access/access-state';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import type { AccessSnapshot } from '@/lib/types/access/principal';
import AccessContext from '@/providers/access-context';
import { buildPrincipal } from '@tests/builders';

function withAccessContext(
  value: AccessSnapshot | null
): ({ children }: { children: ReactNode }) => JSX.Element {
  return function AccessContextWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
  };
}

describe('useAccess', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('returns the live access state when no provider is mounted', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, { [FEATURE_FLAGS.contactsModule]: true });

    const { result } = renderHook(() => useAccess());

    expect(result.current).toBe(accessState.get());
    expect(result.current.principal).toBe(principal);
    expect(result.current.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  it('returns the anonymous snapshot with no provider and no session', () => {
    const { result } = renderHook(() => useAccess());

    expect(result.current).toBe(accessState.get());
    expect(result.current.principal).toBeNull();
    expect(result.current.flags).toEqual({});
  });

  it('returns the context snapshot, not the live state, when a provider is mounted', () => {
    const statePrincipal = buildPrincipal();
    accessState.setSession(statePrincipal, { [FEATURE_FLAGS.contactsModule]: true });
    const contextPrincipal = buildPrincipal();
    const contextSnapshot: AccessSnapshot = {
      principal: contextPrincipal,
      flags: { [FEATURE_FLAGS.dealsModule]: true },
    };

    const { result } = renderHook(() => useAccess(), {
      wrapper: withAccessContext(contextSnapshot),
    });

    expect(result.current).toBe(contextSnapshot);
    expect(result.current.principal).toBe(contextPrincipal);
    expect(result.current.principal).not.toBe(statePrincipal);
    expect(result.current.flags).toEqual({ [FEATURE_FLAGS.dealsModule]: true });
  });

  it('falls back to the live access state when the mounted provider publishes null', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, {});

    const { result } = renderHook(() => useAccess(), { wrapper: withAccessContext(null) });

    expect(result.current).toBe(accessState.get());
    expect(result.current.principal).toBe(principal);
  });

  it('reads the live access state again on every render while no provider is mounted', () => {
    const first = buildPrincipal();
    accessState.setSession(first, {});
    const { result, rerender } = renderHook(() => useAccess());
    expect(result.current.principal).toBe(first);

    const second = buildPrincipal();
    accessState.setSession(second, { [FEATURE_FLAGS.tenantSwitcher]: false });
    rerender();

    expect(result.current.principal).toBe(second);
    expect(result.current.flags).toEqual({ [FEATURE_FLAGS.tenantSwitcher]: false });
  });
});
