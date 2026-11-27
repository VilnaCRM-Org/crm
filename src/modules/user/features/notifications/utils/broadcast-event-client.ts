import type { BroadcastEventClientOptions, BroadcastEventStop } from '../types/broadcast-event';

const STREAM_PATH = '/api/events/stream';

const FIRST_DELAY_MS = 1_000;

const MAX_DELAY_MS = 30_000;

const SEEN_LIMIT = 500;

export default class BroadcastEventClient {
  private readonly seen = new Set<string>();

  private source: EventSource | null = null;

  private timer: number | undefined;

  private attempt = 0;

  private cursor: string | null = null;

  constructor(private readonly options: BroadcastEventClientOptions) {}

  public open(): BroadcastEventStop {
    this.connect();
    return (): void => {
      window.clearTimeout(this.timer);
      this.source?.close();
    };
  }

  private connect(): void {
    const source = new window.EventSource(this.address());
    this.source = source;
    source.onopen = (): void => {
      this.attempt = 0;
    };
    source.onerror = (): void => {
      if (source.readyState === window.EventSource.CLOSED) this.retry();
    };
    source.addEventListener(this.options.parser.type, (frame) => this.accept(frame));
  }

  private address(): string {
    const url = new URL(STREAM_PATH, this.options.base);
    url.searchParams.set('types', this.options.parser.type);
    if (this.cursor !== null) url.searchParams.set('lastEventId', this.cursor);
    return url.toString();
  }

  private accept(frame: MessageEvent<string>): void {
    this.cursor = frame.lastEventId || null;
    const event = this.options.parser.parse(frame.data);
    if (event === null || this.seen.has(event.id)) return;
    this.remember(event.id);
    this.options.receive(event.draft);
  }

  private remember(id: string): void {
    this.seen.add(id);
    const [oldest] = this.seen;
    if (oldest !== undefined && this.seen.size > SEEN_LIMIT) this.seen.delete(oldest);
  }

  private retry(): void {
    const ceiling = Math.min(MAX_DELAY_MS, FIRST_DELAY_MS * 2 ** this.attempt);
    this.attempt += 1;
    this.timer = window.setTimeout(() => this.connect(), ceiling * (0.5 + Math.random() / 2));
  }
}
