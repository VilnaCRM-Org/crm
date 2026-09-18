import { act, renderHook } from '@testing-library/react';

import useConnectivity from '@/hooks/use-connectivity';
import connectivityStateVar from '@/lib/connectivity/connectivity-state-var';

describe('useConnectivity', () => {
  afterEach(() => {
    act(() => connectivityStateVar.setOnline(true));
  });

  it('reads the current online flag from the connectivity var', () => {
    const { result } = renderHook(() => useConnectivity());

    expect(result.current).toBe(true);
  });

  it('re-renders when the browser goes offline and back online', () => {
    const { result } = renderHook(() => useConnectivity());

    act(() => connectivityStateVar.setOnline(false));
    expect(result.current).toBe(false);

    act(() => connectivityStateVar.setOnline(true));
    expect(result.current).toBe(true);
  });
});
