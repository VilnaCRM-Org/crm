import type Adapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import type { SocialLinkCallback } from '@/modules/user/types/social-link/social-link-callback';
import { buildToken } from '@tests/builders';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';
import loadIsolated from '@tests/unit/utils/isolated-module';

const attempt = { provider: 'google', state: `link.${buildToken()}` } as const;
const code = buildToken();
const callback: SocialLinkCallback = { ...attempt, code, error: null };

describe('socialLinkChannelAdapter', () => {
  let socialLinkChannelAdapter: typeof Adapter;

  beforeEach(async () => {
    socialLinkChannelAdapter = await loadIsolated(
      async () =>
        (await import('@/modules/user/lib/social-link/social-link-channel-adapter')).default
    );
  });

  beforeEach(() => FakeBroadcastChannel.install());
  afterEach(() => FakeBroadcastChannel.uninstall());

  it('posts the callback once on the linking channel and closes it', () => {
    socialLinkChannelAdapter.post(callback);

    expect(FakeBroadcastChannel.opened.map(({ name }) => name)).toEqual(['crm.socialLink']);
    expect(FakeBroadcastChannel.opened[0]?.posted).toEqual([callback]);
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
  });

  it('answers with the code of its own attempt and stops listening', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    expect(FakeBroadcastChannel.opened[0]?.name).toBe('crm.socialLink');
    FakeBroadcastChannel.deliver(callback);

    await expect(answer).resolves.toEqual({ code, error: null });
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
  });

  it('answers with a provider refusal and drops every other field', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver({ ...attempt, code: null, error: 'access_denied', extra: 1 });

    await expect(answer).resolves.toEqual({ code: null, error: 'access_denied' });
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'link'],
    ['another provider', { ...callback, provider: 'github' }],
    ['another state', { ...callback, state: 'link.other' }],
  ])('keeps listening after %s', async (_name, data) => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver(data);
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(false);
    FakeBroadcastChannel.deliver(callback);

    await expect(answer).resolves.toEqual({ code, error: null });
  });

  it('reads a code or an error that is not text as missing', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver({ ...attempt, code: { a: 1 }, error: 7 });

    await expect(answer).resolves.toEqual({ code: null, error: null });
  });

  it('gives up and stops listening when the attempt ends', async () => {
    const controller = new AbortController();
    const answer = socialLinkChannelAdapter.next(attempt, controller.signal);

    controller.abort();

    await expect(answer).resolves.toBeNull();
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
  });

  it('never listens for an attempt that already ended', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(socialLinkChannelAdapter.next(attempt, controller.signal)).resolves.toBeNull();
    expect(FakeBroadcastChannel.opened).toHaveLength(0);
  });
});
