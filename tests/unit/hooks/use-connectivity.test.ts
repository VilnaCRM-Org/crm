import { act, renderHook } from '@testing-library/react';

import useConnectivity from '@/hooks/use-connectivity';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('useConnectivity', () => {
  beforeEach(() => resetClientStores());

  it('reads the current online flag from the connectivity store', () => {
    const { result } = renderHook(() => useConnectivity());

    expect(result.current).toBe(true);
  });

  it('re-renders when the browser goes offline and back online', () => {
    const { result } = renderHook(() => useConnectivity());

    act(() => useConnectivityStore.setState({ online: false }));
    expect(result.current).toBe(false);

    act(() => useConnectivityStore.setState({ online: true }));
    expect(result.current).toBe(true);
  });
});
