import { act, renderHook } from '@testing-library/react';

import useSocialLinkAttempt from '@/modules/user/features/settings/hooks/use-social-link-attempt';
import type { SocialLinkTarget } from '@/modules/user/features/settings/types/social-link';
import { buildToken } from '@tests/builders';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';

import {
  buildSocialLinkDeps,
  github,
  google,
  type SocialLinkTestDeps,
} from './social-link-test-deps';

interface FakePopup {
  opener: unknown;
  readonly location: { readonly replace: jest.Mock };
  readonly close: jest.Mock;
}

const authorizationUrl = 'https://provider.example/authorize';
const state = `link.${buildToken()}`;
const code = buildToken();
const started = { kind: 'started', authorizationUrl, state } as const;
const changed = { kind: 'changed' } as const;
const answered = { provider: 'google', state, code, error: null };

const buildPopup = (): FakePopup => ({
  opener: null,
  location: { replace: jest.fn() },
  close: jest.fn(),
});

const render = (
  test: SocialLinkTestDeps
): { link: (target: SocialLinkTarget) => Promise<void>; unmount: () => void } => {
  const { result, unmount } = renderHook(() => useSocialLinkAttempt(test.deps));
  return { link: (target) => result.current(target), unmount };
};

const flush = (): Promise<void> => act(async () => undefined);

describe('useSocialLinkAttempt', () => {
  let open: jest.SpyInstance;
  let popup: FakePopup;

  beforeEach(() => {
    FakeBroadcastChannel.install();
    popup = buildPopup();
    open = jest.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
  });

  afterEach(() => FakeBroadcastChannel.uninstall());

  const begin = async (test: SocialLinkTestDeps): Promise<ReturnType<typeof render>> => {
    test.start.mockResolvedValue(started);
    test.complete.mockResolvedValue(changed);
    const view = render(test);
    void view.link(google);
    await flush();
    return view;
  };

  it('opens the popup before it asks for the authorization URL', () => {
    const test = buildSocialLinkDeps();
    test.start.mockReturnValue(new Promise(() => undefined));

    void render(test).link(google);

    expect(open).toHaveBeenCalledTimes(1);
    expect(test.start.mock.calls).toEqual([['google', expect.any(AbortSignal)]]);
    expect(open.mock.invocationCallOrder[0]).toBeLessThan(
      test.start.mock.invocationCallOrder[0] ?? 0
    );
    expect(popup.location.replace).not.toHaveBeenCalled();
  });

  it('sends the popup to the provider while listening, without staying busy', async () => {
    const test = buildSocialLinkDeps();
    await begin(test);

    expect(popup.location.replace.mock.calls).toEqual([[authorizationUrl]]);
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(false);
    expect(test.hold).toHaveBeenCalledTimes(1);
    expect(test.complete).not.toHaveBeenCalled();
    expect(test.settle).not.toHaveBeenCalled();
  });

  it('completes the link with the code of its own attempt and settles it', async () => {
    const test = buildSocialLinkDeps();
    await begin(test);

    FakeBroadcastChannel.deliver(answered);
    await flush();

    expect(test.complete.mock.calls).toEqual([
      ['google', { code, state }, test.start.mock.calls[0]?.[1]],
    ]);
    expect(test.hold).toHaveBeenCalledTimes(2);
    expect(test.settle.mock.calls).toEqual([
      [{ target: google, intent: 'linked', outcome: changed }],
    ]);
  });

  it.each([
    ['a provider refusal', { code, error: 'access_denied' }, 'cancelled'],
    ['an answer without a code', { code: null, error: null }, 'expired'],
  ])('settles %s without completing', async (_name, answer, reason) => {
    const test = buildSocialLinkDeps();
    await begin(test);

    FakeBroadcastChannel.deliver({ ...answered, ...answer });
    await flush();

    expect(test.complete).not.toHaveBeenCalled();
    expect(test.settle.mock.calls).toEqual([
      [{ target: google, intent: 'linked', outcome: { kind: 'failed', reason } }],
    ]);
  });

  it('closes the popup and settles when the link cannot start', async () => {
    const test = buildSocialLinkDeps();
    const outcome = { kind: 'failed', reason: 'unavailable' } as const;
    test.start.mockResolvedValue(outcome);

    await render(test).link(google);

    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(popup.location.replace).not.toHaveBeenCalled();
    expect(FakeBroadcastChannel.opened).toHaveLength(0);
    expect(test.settle.mock.calls).toEqual([[{ target: google, intent: 'linked', outcome }]]);
  });

  it('settles a blocked popup without asking user-service anything', async () => {
    const test = buildSocialLinkDeps();
    open.mockReturnValue(null);

    await render(test).link(google);

    expect(test.start).not.toHaveBeenCalled();
    expect(test.settle.mock.calls).toEqual([
      [{ target: google, intent: 'linked', outcome: { kind: 'failed', reason: 'blocked' } }],
    ]);
  });

  it('opens nothing while something else is held', async () => {
    const test = buildSocialLinkDeps();
    test.isHeld.mockReturnValue(true);

    await render(test).link(google);

    expect(open).not.toHaveBeenCalled();
    expect(test.settle).not.toHaveBeenCalled();
  });

  it('ends the waiting attempt when another one begins, and settles only the new one', async () => {
    const test = buildSocialLinkDeps();
    const view = await begin(test);
    const second = buildPopup();
    open.mockReturnValue(second as unknown as Window);
    const nextState = `link.${buildToken()}-next`;
    test.start.mockResolvedValue({ ...started, state: nextState });

    void view.link(github);
    await flush();

    expect(popup.close).not.toHaveBeenCalled();
    expect(second.close).not.toHaveBeenCalled();
    expect(test.start.mock.calls[0]?.[1].aborted).toBe(true);
    FakeBroadcastChannel.deliver(answered);
    FakeBroadcastChannel.deliver({ ...answered, provider: 'github', state: nextState });
    await flush();
    expect(test.complete.mock.calls.map(([id]) => id)).toEqual(['github']);
    expect(test.settle.mock.calls.map(([{ target }]) => target.id)).toEqual(['github']);
  });

  it('stops listening when the card goes away, leaving the popup at the provider', async () => {
    const test = buildSocialLinkDeps();
    const view = await begin(test);

    view.unmount();
    await flush();

    expect(popup.close).not.toHaveBeenCalled();
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
    expect(test.settle).not.toHaveBeenCalled();
  });

  it('closes the popup when the card goes away during the start', async () => {
    const test = buildSocialLinkDeps();
    let start: (outcome: unknown) => void = () => undefined;
    test.start.mockReturnValue(new Promise((resolve) => (start = resolve)));
    const view = render(test);
    const pending = view.link(google);

    view.unmount();
    start(started);
    await pending;

    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(popup.location.replace).not.toHaveBeenCalled();
    expect(FakeBroadcastChannel.opened).toHaveLength(0);
    expect(test.settle).not.toHaveBeenCalled();
  });

  it('shows nothing for a link that finishes after the card went away', async () => {
    const test = buildSocialLinkDeps();
    let complete: (outcome: unknown) => void = () => undefined;
    const view = await begin(test);
    test.complete.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    FakeBroadcastChannel.deliver(answered);
    await flush();

    view.unmount();
    complete(changed);
    await flush();

    expect(test.settle).not.toHaveBeenCalled();
  });

  it('unmounts quietly when nothing was attempted', () => {
    expect(() => render(buildSocialLinkDeps()).unmount()).not.toThrow();
  });
});
