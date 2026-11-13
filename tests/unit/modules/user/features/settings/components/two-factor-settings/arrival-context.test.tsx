import { renderHook } from '@testing-library/react';
import { type Context, type ReactNode, useContext } from 'react';

import loadIsolated from '@tests/unit/utils/isolated-module';

import type { TwoFactorSettingsView } from '../../hooks/two-factor-test-deps';

type ArrivalContextType = Context<TwoFactorSettingsView | null>;

const loadArrivalContext = (): Promise<ArrivalContextType> =>
  loadIsolated(() =>
    Promise.resolve(
      jest.requireActual<{ default: ArrivalContextType }>(
        '@/modules/user/features/settings/components/two-factor-settings/arrival-context'
      ).default
    )
  );

describe('ArrivalContext', () => {
  it('defaults to null outside a provider', async () => {
    const ArrivalContext = await loadArrivalContext();

    const { result } = renderHook(() => useContext(ArrivalContext));

    expect(result.current).toBeNull();
  });

  it('carries the view a provider supplies', async () => {
    const ArrivalContext = await loadArrivalContext();
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <ArrivalContext.Provider value="codes">{children}</ArrivalContext.Provider>
    );

    const { result } = renderHook(() => useContext(ArrivalContext), { wrapper });

    expect(result.current).toBe('codes');
  });
});
