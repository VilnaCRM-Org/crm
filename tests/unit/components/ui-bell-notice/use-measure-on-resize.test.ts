import { renderHook } from '@testing-library/react';

import useMeasureOnResize from '@/components/ui-bell-notice/use-measure-on-resize';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

const rows = (): NotificationViewSet => ({ items: [] });

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

describe('useMeasureOnResize', () => {
  it('measures on mount and in the frame after a resize, when the layout has settled', async () => {
    const measure = jest.fn();
    renderHook(() => useMeasureOnResize(measure, jest.fn()));

    expect(measure).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('resize'));
    expect(measure).toHaveBeenCalledTimes(1);
    await nextFrame();
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('measures once for several resizes in one frame', async () => {
    const measure = jest.fn();
    renderHook(() => useMeasureOnResize(measure, jest.fn()));

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    await nextFrame();

    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('drops a measurement still waiting for its frame on unmount', async () => {
    const measure = jest.fn();
    const { unmount } = renderHook(() => useMeasureOnResize(measure, jest.fn()));

    window.dispatchEvent(new Event('resize'));
    unmount();
    await nextFrame();

    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('releases and stops listening on unmount', async () => {
    const measure = jest.fn();
    const release = jest.fn();
    const { unmount } = renderHook(() => useMeasureOnResize(measure, release));

    unmount();
    window.dispatchEvent(new Event('resize'));
    await nextFrame();

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
