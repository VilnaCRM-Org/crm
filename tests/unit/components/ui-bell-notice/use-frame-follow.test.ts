import { renderHook } from '@testing-library/react';

import useFrameFollow from '@/components/ui-bell-notice/use-frame-follow';

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const emit = async (type: string): Promise<void> => {
  window.dispatchEvent(new Event(type));
  await nextFrame();
};

describe('useFrameFollow', () => {
  it('runs in the frame after the followed event and after no other', async () => {
    const run = jest.fn();
    renderHook(() => useFrameFollow('focusin', run));

    await emit('resize');
    expect(run).not.toHaveBeenCalled();
    await emit('focusin');

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('follows the newest callback', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ run }) => useFrameFollow('resize', run), {
      initialProps: { run: first },
    });

    rerender({ run: second });
    await emit('resize');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('cancels a waiting run and stops following on unmount', async () => {
    const run = jest.fn();
    const { unmount } = renderHook(() => useFrameFollow('resize', run));

    window.dispatchEvent(new Event('resize'));
    unmount();
    await emit('resize');

    expect(run).not.toHaveBeenCalled();
  });
});
