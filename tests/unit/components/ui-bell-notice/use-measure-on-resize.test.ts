import { renderHook } from '@testing-library/react';

import useMeasureOnResize from '@/components/ui-bell-notice/use-measure-on-resize';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

const rows = (): NotificationViewSet => ({ items: [] });

describe('useMeasureOnResize', () => {
  it('measures on mount and again on every resize', () => {
    const measure = jest.fn();
    renderHook(() => useMeasureOnResize(measure, jest.fn()));

    expect(measure).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('resize'));
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('releases and stops listening on unmount', () => {
    const measure = jest.fn();
    const release = jest.fn();
    const { unmount } = renderHook(() => useMeasureOnResize(measure, release));

    unmount();
    window.dispatchEvent(new Event('resize'));

    expect(release).toHaveBeenCalledTimes(1);
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('measures again, after a release, when the rerun key changes', () => {
    const measure = jest.fn();
    const release = jest.fn();
    const { rerender } = renderHook(({ key }) => useMeasureOnResize(measure, release, key), {
      initialProps: { key: rows() },
    });

    rerender({ key: rows() });

    expect(release).toHaveBeenCalledTimes(1);
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('keeps one measurement for a rerender with the same inputs', () => {
    const measure = jest.fn();
    const release = jest.fn();
    const key = rows();
    const { rerender } = renderHook(() => useMeasureOnResize(measure, release, key));

    rerender();

    expect(measure).toHaveBeenCalledTimes(1);
  });
});
