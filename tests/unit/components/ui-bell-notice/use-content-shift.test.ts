import { renderHook } from '@testing-library/react';

import useContentShift from '@/components/ui-bell-notice/use-content-shift';
import stubResizeObserver, { removeResizeObserver } from '@tests/unit/utils/stub-resize-observer';

describe('useContentShift', () => {
  afterEach(() => removeResizeObserver());

  it('runs whenever the page body changes size', () => {
    const { observed, fire } = stubResizeObserver();
    const run = jest.fn();
    renderHook(() => useContentShift(run));

    expect(observed).toEqual([document.body]);
    expect(run).not.toHaveBeenCalled();
    fire();
    fire();

    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledWith();
  });

  it('observes once and stops on unmount', () => {
    const { instances, disconnect } = stubResizeObserver();
    const run = jest.fn();
    const { rerender, unmount } = renderHook(() => useContentShift(run));

    rerender();
    expect(instances()).toBe(1);
    expect(disconnect).not.toHaveBeenCalled();

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('follows the latest run', () => {
    const { fire, disconnect } = stubResizeObserver();
    const [first, second] = [jest.fn(), jest.fn()];
    const { rerender } = renderHook(({ run }) => useContentShift(run), {
      initialProps: { run: first },
    });

    rerender({ run: second });
    expect(disconnect).toHaveBeenCalledTimes(1);
    fire();

    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does nothing where the browser observes no sizes', () => {
    removeResizeObserver();
    const run = jest.fn();

    expect(() => renderHook(() => useContentShift(run)).unmount()).not.toThrow();
    expect(run).not.toHaveBeenCalled();
  });
});
