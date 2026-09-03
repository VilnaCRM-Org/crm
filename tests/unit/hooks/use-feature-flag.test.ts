import { renderHook } from '@testing-library/react';

import useFeatureFlag from '@/hooks/use-feature-flag';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

describe('useFeatureFlag', () => {
  afterEach(() => {
    clearConfigBlock();
  });

  it('reports a flag as disabled when no runtime configuration is rendered', () => {
    const { result } = renderHook(() => useFeatureFlag('forgotPassword'));

    expect(result.current).toBe(false);
  });

  it('reports a flag as enabled when the runtime configuration turns it on', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

    const { result } = renderHook(() => useFeatureFlag('forgotPassword'));

    expect(result.current).toBe(true);
  });

  it('reports a flag as disabled when the runtime configuration turns it off', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: false } }));

    const { result } = renderHook(() => useFeatureFlag('forgotPassword'));

    expect(result.current).toBe(false);
  });

  it('falls back to the declared default when the configured value is not a boolean', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: 'true' } }));

    const { result } = renderHook(() => useFeatureFlag('forgotPassword'));

    expect(result.current).toBe(false);
  });

  it('keeps the value stable across re-renders without re-subscribing', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

    const { result, rerender } = renderHook(() => useFeatureFlag('forgotPassword'));

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });
});
