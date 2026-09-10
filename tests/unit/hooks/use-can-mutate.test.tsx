// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import useCanMutate from '@/hooks/use-can-mutate';
import accessState from '@/lib/access/access-state';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import { buildPrincipal } from '@tests/builders';

const renderCanMutate = (): boolean =>
  renderHook(() => useCanMutate(MUTATION_KEYS.createUser)).result.current;

describe('useCanMutate', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('returns true when the mutation is in the published set', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }), {});

    expect(renderCanMutate()).toBe(true);
  });

  it('returns false when the published set is empty', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});

    expect(renderCanMutate()).toBe(false);
  });

  it('returns false while anonymous', () => {
    expect(renderCanMutate()).toBe(false);
  });

  it('re-evaluates when a new set is published to the mounted hook', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});
    const { result } = renderHook(() => useCanMutate(MUTATION_KEYS.createUser));
    expect(result.current).toBe(false);

    act(() => {
      accessState.setSession(buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }), {});
    });

    expect(result.current).toBe(true);
  });
});
