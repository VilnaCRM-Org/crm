import { renderHook, type RenderHookResult } from '@testing-library/react';

import usePreviousView from '@/modules/user/features/settings/hooks/use-previous-view';

import type { TwoFactorSettingsView } from './two-factor-test-deps';

type View = TwoFactorSettingsView;

const mount = (view: View): RenderHookResult<View | null, { view: View }> =>
  renderHook(({ view: current }) => usePreviousView(current), { initialProps: { view } });

describe('usePreviousView', () => {
  it('has no previous view on the first render', () => {
    expect(mount('on').result.current).toBeNull();
  });

  it('reports the view it came from after a change', () => {
    const { result, rerender } = mount('disable');

    rerender({ view: 'on' });

    expect(result.current).toBe('disable');
  });

  it('keeps reporting the same origin while the view stays', () => {
    const { result, rerender } = mount('regenerate');
    rerender({ view: 'on' });

    rerender({ view: 'on' });
    rerender({ view: 'on' });

    expect(result.current).toBe('regenerate');
  });

  it('follows each change in turn', () => {
    const { result, rerender } = mount('off');

    rerender({ view: 'setup' });
    expect(result.current).toBe('off');
    rerender({ view: 'codes' });
    expect(result.current).toBe('setup');
    rerender({ view: 'on' });
    expect(result.current).toBe('codes');
  });
});
