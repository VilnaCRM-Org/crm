import { act, renderHook } from '@testing-library/react';

import useSocialBusy from '@/modules/user/features/settings/hooks/use-social-busy';

describe('useSocialBusy', () => {
  it('is free until something is held', () => {
    const { result } = renderHook(() => useSocialBusy());

    expect(result.current.busy).toBe(false);
    expect(result.current.isHeld()).toBe(false);
  });

  it('is held at once, stays busy while the work runs and hands its outcome on', async () => {
    const { result } = renderHook(() => useSocialBusy());
    let settle: (value: string) => void = () => undefined;
    let held: Promise<string> = Promise.resolve('');

    act(() => {
      held = result.current.hold(new Promise<string>((resolve) => (settle = resolve)));
      expect(result.current.isHeld()).toBe(true);
    });
    expect(result.current.busy).toBe(true);

    await act(async () => {
      settle('done');
      await held;
    });

    await expect(held).resolves.toBe('done');
    expect(result.current.busy).toBe(false);
    expect(result.current.isHeld()).toBe(false);
  });

  it('stays busy until the last of two overlapping holds ends', async () => {
    const { result } = renderHook(() => useSocialBusy());
    const ends: (() => void)[] = [];
    const work = (): Promise<void> => new Promise((resolve) => ends.push(resolve));
    act(() => {
      void result.current.hold(work());
      void result.current.hold(work());
    });

    await act(async () => ends[0]?.());
    expect(result.current.busy).toBe(true);
    expect(result.current.isHeld()).toBe(true);

    await act(async () => ends[1]?.());
    expect(result.current.busy).toBe(false);
    expect(result.current.isHeld()).toBe(false);
  });
});
