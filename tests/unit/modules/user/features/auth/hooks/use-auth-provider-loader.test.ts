import { renderHook } from '@testing-library/react';

import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import { AuthProviderLoader } from '@auth/stores';

describe('useAuthProviderLoader', () => {
  it('keeps one loader per mount and builds a new one for the next mount', () => {
    const { result: firstMount, rerender } = renderHook(() => useAuthProviderLoader());
    const initial = firstMount.current;
    rerender();
    const { result: secondMount } = renderHook(() => useAuthProviderLoader());

    expect(initial).toBeInstanceOf(AuthProviderLoader);
    expect(firstMount.current).toBe(initial);
    expect(secondMount.current).not.toBe(initial);
  });
});
