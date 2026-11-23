import { act, renderHook } from '@testing-library/react';

import useSocialUnlink from '@/modules/user/features/settings/hooks/use-social-unlink';

import { buildSocialLinkDeps, github, google } from './social-link-test-deps';

describe('useSocialUnlink', () => {
  it('unlinks once while busy and settles the outcome', async () => {
    const { deps, unlink, hold, settle } = buildSocialLinkDeps();
    const outcome = { kind: 'changed' } as const;
    unlink.mockResolvedValue(outcome);
    const { result } = renderHook(() => useSocialUnlink(deps));

    await act(() => result.current(github));

    expect(unlink.mock.calls).toEqual([['github', expect.any(AbortSignal)]]);
    expect(hold).toHaveBeenCalledTimes(1);
    expect(settle.mock.calls).toEqual([[{ target: github, intent: 'unlinked', outcome }]]);
  });

  it('asks nothing while something else is held', async () => {
    const { deps, unlink, isHeld, settle } = buildSocialLinkDeps();
    isHeld.mockReturnValue(true);
    const { result } = renderHook(() => useSocialUnlink(deps));

    await act(() => result.current(google));

    expect(unlink).not.toHaveBeenCalled();
    expect(settle).not.toHaveBeenCalled();
  });

  it('aborts on unmount and settles nothing', async () => {
    const { deps, unlink, settle } = buildSocialLinkDeps();
    let finish: (outcome: unknown) => void = () => undefined;
    unlink.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useSocialUnlink(deps));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current(google);
    });

    unmount();
    expect(unlink.mock.calls[0]?.[1].aborted).toBe(true);
    finish({ kind: 'changed' });
    await pending;

    expect(settle).not.toHaveBeenCalled();
  });
});
