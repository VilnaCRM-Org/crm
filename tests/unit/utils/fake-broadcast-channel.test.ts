import FakeBroadcastChannel from './fake-broadcast-channel';

const CHANNEL = 'crm.socialLink';

const listening = (name: string): { channel: FakeBroadcastChannel; received: unknown[] } => {
  const channel = new FakeBroadcastChannel(name);
  const received: unknown[] = [];
  channel.onmessage = ({ data }): void => {
    received.push(data);
  };
  return { channel, received };
};

const settle = (): Promise<void> => Promise.resolve();

describe('FakeBroadcastChannel', () => {
  beforeEach(() => FakeBroadcastChannel.install());
  afterEach(() => FakeBroadcastChannel.uninstall());

  it('delivers only to the open channels of the named channel', () => {
    const same = listening(CHANNEL);
    const other = listening('crm.other');
    const closed = listening(CHANNEL);
    closed.channel.close();

    FakeBroadcastChannel.deliver('message', CHANNEL);

    expect(same.received).toEqual(['message']);
    expect(other.received).toEqual([]);
    expect(closed.received).toEqual([]);
  });

  it('relays a post to every other open same-name channel, after the post returns', async () => {
    const sender = listening(CHANNEL);
    const peer = listening(CHANNEL);
    const other = listening('crm.other');

    sender.channel.postMessage('message');
    expect(peer.received).toEqual([]);
    await settle();

    expect(sender.channel.posted).toEqual(['message']);
    expect(sender.received).toEqual([]);
    expect(peer.received).toEqual(['message']);
    expect(other.received).toEqual([]);
  });

  it('still relays a post whose sender closed straight after it', async () => {
    const sender = new FakeBroadcastChannel(CHANNEL);
    const peer = listening(CHANNEL);

    sender.postMessage('message');
    sender.close();
    await settle();

    expect(peer.received).toEqual(['message']);
  });

  it('skips a peer that closed before the post arrived', async () => {
    const sender = new FakeBroadcastChannel(CHANNEL);
    const peer = listening(CHANNEL);

    sender.postMessage('message');
    peer.channel.close();
    await settle();

    expect(peer.received).toEqual([]);
  });

  it('refuses a post on a closed channel, as the browser does', () => {
    const sender = new FakeBroadcastChannel(CHANNEL);
    sender.close();

    expect(() => sender.postMessage('message')).toThrow(
      expect.objectContaining({ name: 'InvalidStateError' })
    );
    expect(sender.posted).toEqual([]);
  });
});
