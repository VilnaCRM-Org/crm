import { renderHook } from '@testing-library/react';

import useAsyncList, { asyncListLoader } from '@/hooks/use-async-list';

describe('useAsyncList unmount cleanup', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deactivates the subscription it handed the loader when the component unmounts', () => {
    const run = jest.spyOn(asyncListLoader, 'run');

    const { unmount } = renderHook(() => useAsyncList(() => new Promise<string[]>(() => {})));
    const subscription = run.mock.calls[0]?.[1];

    expect(subscription).toEqual({ active: true });

    unmount();

    expect(subscription).toEqual({ active: false });
  });

  it('hands the loader a subscription that stays active while the component is mounted', () => {
    const run = jest.spyOn(asyncListLoader, 'run');

    const { rerender } = renderHook(() => useAsyncList(() => new Promise<string[]>(() => {})));
    rerender();

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[1]).toEqual({ active: true });
  });
});
