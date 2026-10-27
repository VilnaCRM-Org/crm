import { renderHook } from '@testing-library/react';

import useLatestRef from '@/components/layouts/use-latest-ref';

describe('useLatestRef', () => {
  it('holds the value it was given', () => {
    const { result } = renderHook(() => useLatestRef('first'));

    expect(result.current.current).toBe('first');
  });

  it('follows the value across renders while keeping one ref object', () => {
    const { result, rerender } = renderHook(({ value }) => useLatestRef(value), {
      initialProps: { value: 'first' },
    });
    const ref = result.current;

    rerender({ value: 'second' });

    expect(result.current).toBe(ref);
    expect(result.current.current).toBe('second');
  });

  it('can hold undefined', () => {
    const { result } = renderHook(() => useLatestRef<string | undefined>(undefined));

    expect(result.current.current).toBeUndefined();
  });
});
