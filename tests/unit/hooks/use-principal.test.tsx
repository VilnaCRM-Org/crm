// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import usePrincipal from '@/hooks/use-principal';
import accessState from '@/lib/access/access-state';
import { ROLES } from '@/lib/access/permission-catalog';
import AccessProvider from '@/providers/access-provider';
import { buildPrincipal } from '@tests/builders';

describe('usePrincipal', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('returns the seeded principal', () => {
    const principal = buildPrincipal({ roles: [ROLES.manager] });
    accessState.setSession(principal, {});

    const { result } = renderHook(() => usePrincipal());

    expect(result.current).toBe(principal);
    expect(result.current?.email).toBe(principal.email);
    expect(result.current?.id).toBe(principal.id);
    expect(result.current?.roles).toEqual([ROLES.manager]);
  });

  it('returns null while anonymous', () => {
    const { result } = renderHook(() => usePrincipal());

    expect(result.current).toBeNull();
  });

  it('returns null again after the session is cleared', () => {
    accessState.setSession(buildPrincipal(), {});
    const { result, rerender } = renderHook(() => usePrincipal());
    expect(result.current).not.toBeNull();

    accessState.clear();
    rerender();

    expect(result.current).toBeNull();
  });

  it('tracks the principal published by a mounted provider', () => {
    const { result } = renderHook(() => usePrincipal(), { wrapper: AccessProvider });
    expect(result.current).toBeNull();

    const principal = buildPrincipal();
    act(() => {
      accessState.setSession(principal, {});
    });

    expect(result.current).toBe(principal);
  });
});
