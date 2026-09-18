import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useOfflineNotice from '@/components/ui-offline-notice/use-offline-notice';
import testI18n from '@tests/i18n/test-i18n';

const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';
const RESTORED = 'Connection restored.';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

const renderNotice = (
  online: boolean
): ReturnType<typeof renderHook<string, { online: boolean }>> =>
  renderHook(({ online: value }) => useOfflineNotice(value), {
    wrapper,
    initialProps: { online },
  });

describe('useOfflineNotice', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says nothing on a mount that is already online', () => {
    const { result } = renderNotice(true);

    expect(result.current).toBe('');
  });

  it('shows the offline copy while offline, from the first render', () => {
    const { result } = renderNotice(false);

    expect(result.current).toBe(OFFLINE);
  });

  it('announces the restored connection after an observed offline period', () => {
    const { result, rerender } = renderNotice(true);

    rerender({ online: false });
    expect(result.current).toBe(OFFLINE);

    rerender({ online: true });
    expect(result.current).toBe(RESTORED);
  });

  it('clears the restored copy after five seconds', () => {
    const { result, rerender } = renderNotice(false);

    rerender({ online: true });
    act(() => jest.advanceTimersByTime(4_999));
    expect(result.current).toBe(RESTORED);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('');
  });

  it('shows the offline copy again if the network drops during the restored notice', () => {
    const { result, rerender } = renderNotice(false);
    rerender({ online: true });

    rerender({ online: false });
    expect(result.current).toBe(OFFLINE);

    act(() => jest.advanceTimersByTime(5_000));
    expect(result.current).toBe(OFFLINE);
  });

  it('restarts the restored notice for a second reconnection', () => {
    const { result, rerender } = renderNotice(false);
    rerender({ online: true });
    act(() => jest.advanceTimersByTime(5_000));
    expect(result.current).toBe('');

    rerender({ online: false });
    rerender({ online: true });

    expect(result.current).toBe(RESTORED);
  });

  it('cancels the pending clear timer on unmount', () => {
    const { rerender, unmount } = renderNotice(false);
    rerender({ online: true });

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
