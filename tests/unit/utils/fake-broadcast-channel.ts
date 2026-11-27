export default class FakeBroadcastChannel {
  public static opened: FakeBroadcastChannel[] = [];

  private static original: typeof BroadcastChannel | undefined;

  public readonly posted: unknown[] = [];

  public closed = false;

  public onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(public readonly name: string) {
    FakeBroadcastChannel.opened.push(this);
  }

  public static install(): void {
    FakeBroadcastChannel.opened = [];
    FakeBroadcastChannel.original = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;
  }

  public static uninstall(): void {
    globalThis.BroadcastChannel =
      FakeBroadcastChannel.original as unknown as typeof BroadcastChannel;
  }

  public static deliver(data: unknown, name: string): void {
    FakeBroadcastChannel.listenersOf(name).forEach((channel) => channel.receive(data));
  }

  private static listenersOf(name: string, sender?: FakeBroadcastChannel): FakeBroadcastChannel[] {
    return FakeBroadcastChannel.opened.filter(
      (channel) => channel !== sender && !channel.closed && channel.name === name
    );
  }

  public postMessage(data: unknown): void {
    if (this.closed) throw new DOMException('The channel is closed.', 'InvalidStateError');
    this.posted.push(data);
    const listeners = FakeBroadcastChannel.listenersOf(this.name, this);
    void Promise.resolve().then(() => listeners.forEach((channel) => channel.receive(data)));
  }

  public close(): void {
    this.closed = true;
  }

  private receive(data: unknown): void {
    if (!this.closed) this.onmessage?.({ data });
  }
}
