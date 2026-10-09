import { act, renderHook } from '@testing-library/react';

import useConnectivity from '@/hooks/use-connectivity';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('useConnectivityStore', () => {
  beforeEach(() => resetClientStores());

  it('starts online in a freshly loaded module', async () => {
    const fresh = await loadIsolated(
      async () => (await import('@/lib/connectivity/use-connectivity-store')).default
    );

    expect(fresh.getState()).toEqual({ online: true });
  });

  it('writes a new flag and notifies subscribers when it changes', () => {
    const listener = jest.fn();
    const unsubscribe = useConnectivityStore.subscribe(listener);

    useConnectivityStore.setState({ online: false });
    unsubscribe();

    expect(useConnectivityStore.getState()).toEqual({ online: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('re-renders a useConnectivity consumer only when the flag changes', () => {
    const probe = jest.fn();
    const { result } = renderHook(() => {
      probe();
      return useConnectivity();
    });
    expect(result.current).toBe(true);
    expect(probe).toHaveBeenCalledTimes(1);

    act(() => useConnectivityStore.setState({ online: true }));
    expect(probe).toHaveBeenCalledTimes(1);

    act(() => useConnectivityStore.setState({ online: false }));
    expect(result.current).toBe(false);
    expect(probe).toHaveBeenCalledTimes(2);
  });

  it('restores the online baseline through the reset helper', () => {
    useConnectivityStore.setState({ online: false });

    resetClientStores();

    expect(useConnectivityStore.getState()).toEqual({ online: true });
  });
});
