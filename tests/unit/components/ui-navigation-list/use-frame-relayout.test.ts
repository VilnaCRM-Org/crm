import { renderHook } from '@testing-library/react';

import useFrameRelayout from '@/components/ui-navigation-list/use-frame-relayout';

describe('useFrameRelayout', () => {
  afterEach(() => jest.restoreAllMocks());

  it('follows once at mount, then once per frame for any burst of scroll and resize', () => {
    const queue: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queue.push(callback);

      return queue.length;
    });
    const follow = jest.fn();
    renderHook(() => useFrameRelayout(follow));
    expect(follow).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(queue).toHaveLength(1);
    queue.splice(0).forEach((callback) => callback(0));
    expect(follow).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('resize'));
    expect(queue).toHaveLength(1);
  });

  it('cancels the pending frame and removes both listeners on unmount', () => {
    jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const follow = jest.fn();
    const { unmount } = renderHook(() => useFrameRelayout(follow));
    window.dispatchEvent(new Event('scroll'));

    unmount();
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    expect(cancel).toHaveBeenCalledWith(7);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(follow).toHaveBeenCalledTimes(1);
  });
});
