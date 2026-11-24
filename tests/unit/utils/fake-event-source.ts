type Listener = (frame: { data: string; lastEventId: string }) => void;

export default class FakeEventSource {
  public static readonly CLOSED = 2;

  public static opened: FakeEventSource[] = [];

  public readyState = 1;

  public onopen: (() => void) | null = null;

  public onerror: (() => void) | null = null;

  public readonly listeners = new Map<string, Listener>();

  constructor(
    public readonly url: string,
    public readonly init?: EventSourceInit
  ) {
    FakeEventSource.opened.push(this);
  }

  public static last(): FakeEventSource {
    const source = FakeEventSource.opened.at(-1);
    if (source === undefined) throw new Error('No EventSource was opened');
    return source;
  }

  public addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, listener);
  }

  public close(): void {
    this.readyState = FakeEventSource.CLOSED;
  }

  public send(data: string, lastEventId = '1'): void {
    this.listeners.get('crm.broadcast')?.({ data, lastEventId });
  }

  public fail(readyState: number): void {
    this.readyState = readyState;
    this.onerror?.();
  }
}
