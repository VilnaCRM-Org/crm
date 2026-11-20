import { renderHook, waitFor } from '@testing-library/react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useSocialCallbackRelay from '@auth/hooks/use-social-callback-relay';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  SocialCallbackView,
  SocialRelay,
} from '@auth/types/social-sign-in/social-callback-view';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';

const starting = { status: 'starting', provider: 'google', label: 'Google' } as const;
const relaying = { status: 'relaying', provider: 'github', label: 'GitHub' } as const;
const AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth?state=s';

let keyCounter = 0;
const nextKey = (): string => {
  keyCounter += 1;
  return `key-${keyCounter}`;
};

interface Harness {
  loader: AuthProviderLoader;
  resolve: jest.Mock;
  start: jest.Mock;
  complete: jest.Mock;
}

const harness = (): Harness => {
  const start = jest.fn();
  const complete = jest.fn();
  const resolve = jest.fn().mockResolvedValue({ start, complete });
  return { loader: { resolve } as unknown as AuthProviderLoader, resolve, start, complete };
};

const startRun = (settle: (view: SocialCallbackView) => void): SocialRelay => ({
  kind: 'start',
  key: nextKey(),
  view: starting,
  settle,
});

const completeRun = (settle: (view: SocialCallbackView) => void): SocialRelay => ({
  kind: 'complete',
  key: nextKey(),
  view: relaying,
  params: { code: 'c', state: 's' },
  settle,
});

describe('useSocialCallbackRelay', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('does nothing without a run', () => {
    const { loader, resolve } = harness();

    renderHook(() => useSocialCallbackRelay(loader, null));

    expect(resolve).not.toHaveBeenCalled();
  });

  it('starts through the provider it resolves and settles the leaving view', async () => {
    const { loader, resolve, start } = harness();
    start.mockResolvedValue({ kind: 'redirect', authorizationUrl: AUTHORIZE, state: 's' });
    const settle = jest.fn();
    const run = startRun(settle);

    renderHook(() => useSocialCallbackRelay(loader, run));

    await waitFor(() =>
      expect(settle).toHaveBeenCalledWith({
        status: 'leaving',
        label: 'Google',
        authorizationUrl: AUTHORIZE,
      })
    );
    expect(resolve).toHaveBeenCalledWith(AUTH_TOKENS.SocialSignInProvider);
    expect(start).toHaveBeenCalledWith('google', expect.any(AbortSignal));
  });

  it('completes with the run parameters and settles the outcome view', async () => {
    const { loader, complete } = harness();
    complete.mockResolvedValue({ kind: 'failed', error: 'expired' });
    const settle = jest.fn();
    const run = completeRun(settle);

    renderHook(() => useSocialCallbackRelay(loader, run));

    await waitFor(() =>
      expect(settle).toHaveBeenCalledWith({
        status: 'failed',
        provider: 'github',
        label: 'GitHub',
        error: 'expired',
      })
    );
    expect(complete).toHaveBeenCalledWith(
      'github',
      { code: 'c', state: 's' },
      expect.any(AbortSignal)
    );
  });

  it('settles the unavailable view when the provider cannot load', async () => {
    const { loader, resolve } = harness();
    resolve.mockRejectedValue(new Error('chunk failed'));
    const settle = jest.fn();

    renderHook(() => useSocialCallbackRelay(loader, startRun(settle)));

    await waitFor(() =>
      expect(settle).toHaveBeenCalledWith(expect.objectContaining({ error: 'unavailable' }))
    );
  });

  it('shares one relay between runs with the same key', async () => {
    const { loader, complete } = harness();
    complete.mockResolvedValue({ kind: 'signed-in' });
    jest.spyOn(socialSignInFlowSource, 'takeDestination').mockReturnValue('/');
    const settle = jest.fn();
    const run = completeRun(settle);

    const view = renderHook(() => useSocialCallbackRelay(loader, run));
    const utils = renderHook(() => useSocialCallbackRelay(loader, run));

    await waitFor(() => expect(settle).toHaveBeenCalledTimes(2));
    expect(complete).toHaveBeenCalledTimes(1);
    view.unmount();
    utils.unmount();
  });

  it('starts a fresh relay for the same key once the first one settled', async () => {
    const { loader, start } = harness();
    start.mockResolvedValue({ kind: 'failed', error: 'unavailable' });
    const settle = jest.fn();
    const run = startRun(settle);

    const { unmount } = renderHook(() => useSocialCallbackRelay(loader, run));
    await waitFor(() => expect(settle).toHaveBeenCalledTimes(1));
    unmount();
    renderHook(() => useSocialCallbackRelay(loader, run));

    await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
  });

  it('does not settle after the hook unmounted', async () => {
    const { loader, start } = harness();
    let finish: (value: unknown) => void = () => undefined;
    start.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const settle = jest.fn();

    const { unmount } = renderHook(() => useSocialCallbackRelay(loader, startRun(settle)));
    await waitFor(() => expect(start).toHaveBeenCalled());
    unmount();
    finish({ kind: 'failed', error: 'generic' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(settle).not.toHaveBeenCalled();
  });
});
