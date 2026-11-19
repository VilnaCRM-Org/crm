import { renderHook } from '@testing-library/react';

import observabilityCore from '@/services/observability/observability-core';
import useFailureCapture from '@auth/stores/use-failure-capture';

describe('useFailureCapture', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports a failure to observability under the source it was built with', () => {
    const capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => {});
    const failure = new Error('chunk failed');
    const { result } = renderHook(() => useFailureCapture('auth:recovery-load'));

    result.current(failure);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(failure, { source: 'auth:recovery-load' });
  });

  it('keeps one capture function across renders', () => {
    const { result, rerender } = renderHook(() => useFailureCapture('auth:recovery-load'));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
