import type Adapter from '@/modules/user/lib/social-link/social-link-channel-adapter';
import type { SocialLinkCallback } from '@/modules/user/types/social-link/social-link-callback';
import { buildToken } from '@tests/builders';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';
import loadIsolated from '@tests/unit/utils/isolated-module';

const CHANNEL = 'crm.socialLink';
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

    expect(FakeBroadcastChannel.opened.map(({ name }) => name)).toEqual([CHANNEL]);
    expect(FakeBroadcastChannel.opened[0]?.posted).toEqual([callback]);
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
  });

  it('answers with the code of its own attempt and stops listening', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    expect(FakeBroadcastChannel.opened[0]?.name).toBe(CHANNEL);
    FakeBroadcastChannel.deliver(callback, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'code', code });
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(true);
  });

  it.each([
    ['a provider refusal without a code', null, 'access_denied'],
    ['a provider refusal with a code', code, 'access_denied'],
    ['an empty provider refusal', null, ''],
  ])('answers %s as refused and drops every other field', async (_name, sent, error) => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver({ ...attempt, code: sent, error, extra: 1 }, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'refused' });
  });

  it.each([
    ['no code', null],
    ['an empty code', ''],
    ['a code of spaces', '   '],
    ['a code of tabs and line breaks', '\t\n'],
  ])('answers %s as missing', async (_name, sent) => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver({ ...attempt, code: sent, error: null }, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'missing' });
  });

  it.each([
    ['a code that is not text', { a: 1 }, null],
    ['an error that is not text', code, 7],
    ['a message without its fields', undefined, undefined],
  ])('answers %s as malformed', async (_name, sent, error) => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver({ ...attempt, code: sent, error }, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'malformed' });
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'link'],
    ['another provider', { ...callback, provider: 'github' }],
    ['another state', { ...callback, state: 'link.other' }],
  ])('keeps listening after %s', async (_name, data) => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver(data, CHANNEL);
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(false);
    FakeBroadcastChannel.deliver(callback, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'code', code });
  });

  it('ignores its own attempt when it arrives on another channel', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    FakeBroadcastChannel.deliver(callback, 'crm.socialSignIn');
    expect(FakeBroadcastChannel.opened[0]?.closed).toBe(false);
    FakeBroadcastChannel.deliver(callback, CHANNEL);

    await expect(answer).resolves.toEqual({ kind: 'code', code });
  });

  it('answers with the callback the popup posts on the same channel', async () => {
    const answer = socialLinkChannelAdapter.next(attempt, new AbortController().signal);

    socialLinkChannelAdapter.post(callback);

    await expect(answer).resolves.toEqual({ kind: 'code', code });
    expect(FakeBroadcastChannel.opened.map(({ closed }) => closed)).toEqual([true, true]);
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
