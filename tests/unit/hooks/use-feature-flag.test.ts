import { renderHook } from '@testing-library/react';

import useFeatureFlag from '@/hooks/use-feature-flag';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

const PROBE_FLAG = 'probeFlag';

describe('useFeatureFlag', () => {
  afterEach(() => {
    clearConfigBlock();
  });

  it('reports a flag as enabled when the runtime configuration turns it on', () => {
    writeConfigBlock(JSON.stringify({ flags: { [PROBE_FLAG]: true } }));

    const { result } = renderHook(() => useFeatureFlag(PROBE_FLAG as never));

    expect(result.current).toBe(true);
  });

  it('reports a flag as disabled when the runtime configuration turns it off', () => {
    writeConfigBlock(JSON.stringify({ flags: { [PROBE_FLAG]: false } }));

    const { result } = renderHook(() => useFeatureFlag(PROBE_FLAG as never));

    expect(result.current).toBe(false);
  });

  it('keeps the value stable across re-renders without re-subscribing', () => {
    writeConfigBlock(JSON.stringify({ flags: { [PROBE_FLAG]: true } }));

    const { result, rerender } = renderHook(() => useFeatureFlag(PROBE_FLAG as never));

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });
});
