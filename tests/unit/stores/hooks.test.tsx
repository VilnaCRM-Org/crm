import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import useAppDispatch, { useAppSelector } from '@/stores/hooks';

jest.mock('@/stores', () => ({
  __esModule: true,
  default: {},
}));

function makeWrapper(
  store: ReturnType<typeof configureStore>
): ({ children }: { children: React.ReactNode }) => React.ReactElement {
  function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return <Provider store={store}>{children}</Provider>;
  }

  return Wrapper;
}

describe('useAppDispatch', () => {
  it('returns the store dispatch function', () => {
    const store = configureStore({ reducer: { value: (state = 0) => state } });

    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: makeWrapper(store),
    });

    expect(typeof result.current).toBe('function');
    expect(result.current).toBe(store.dispatch);
  });
});

describe('useAppSelector', () => {
  it('selects state from the store', () => {
    const store = configureStore({ reducer: { value: (state = 42) => state } });

    const { result } = renderHook(() => useAppSelector((state) => state), {
      wrapper: makeWrapper(store),
    });

    expect(result.current).toEqual({ value: 42 });
  });
});
