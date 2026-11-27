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

  public static deliver(data: unknown): void {
    FakeBroadcastChannel.opened
      .filter(({ closed }) => !closed)
      .forEach((channel) => channel.onmessage?.({ data }));
  }

  public postMessage(data: unknown): void {
    this.posted.push(data);
  }

  public close(): void {
    this.closed = true;
  }
}
