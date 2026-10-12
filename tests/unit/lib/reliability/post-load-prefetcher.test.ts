import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import PostLoadPrefetcher from '@/lib/reliability/post-load-prefetcher';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';
import type {
  PrefetchHost,
  PrefetchHostEvent,
  PrefetchListenerOptions,
} from '@/lib/reliability/types/prefetch-host';
import { buildToken } from '@tests/builders';

interface FakeHost extends PrefetchHost {
  readyState: DocumentReadyState;
  onLine: boolean;
  readonly addEventListener: jest.Mock<
    void,
    [PrefetchHostEvent, () => void, PrefetchListenerOptions]
  >;
  fire(type: PrefetchHostEvent): void;
}

const INTENT = { once: true, passive: true };
const PREFETCH_DELAY_MS = 2000;

const createHost = (readyState: DocumentReadyState = 'loading'): FakeHost => {
  const listeners = new Map<PrefetchHostEvent, (() => void)[]>();
  const host: FakeHost = {
    readyState,
    onLine: true,
    get document(): { readonly readyState: DocumentReadyState } {
      return { readyState: host.readyState };
    },
    get navigator(): { readonly onLine: boolean } {
      return { onLine: host.onLine };
    },
    addEventListener: jest.fn<void, [PrefetchHostEvent, () => void, PrefetchListenerOptions]>(
      (type, listener) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      }
    ),
    setTimeout: (handler: () => void, timeout: number): number =>
      window.setTimeout(handler, timeout),
    fire: (type: PrefetchHostEvent): void => {
      const pending = listeners.get(type) ?? [];
      listeners.delete(type);
      pending.forEach((listener) => listener());
    },
  };
  return host;
};

const createTarget = (): jest.Mocked<ModuleLoader<unknown>> => ({
  load: jest.fn().mockResolvedValue({ default: buildToken() }),
});

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk error-page failed.'), { name: 'ChunkLoadError' });

const registeredTypes = (host: FakeHost): PrefetchHostEvent[] =>
  host.addEventListener.mock.calls.map(([type]) => type);

describe('PostLoadPrefetcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits for load, the first interaction and then the delay before loading every target', () => {
    const host = createHost('loading');
    const targets = [createTarget(), createTarget()];

    new PostLoadPrefetcher(targets).attach(host);

    expect(registeredTypes(host)).toEqual(['load']);
    expect(host.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), {
      once: true,
    });

    host.fire('load');
    expect(host.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), INTENT);
    expect(host.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), INTENT);

    host.fire('pointerdown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS - 1);
    targets.forEach((target) => expect(target.load).not.toHaveBeenCalled());

    jest.advanceTimersByTime(1);
    targets.forEach((target) => expect(target.load).toHaveBeenCalledTimes(1));
  });

  it('never loads the targets for a page nobody interacts with', () => {
    const host = createHost('complete');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    host.fire('load');
    host.fire('online');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS * 10);

    expect(registeredTypes(host)).toEqual(['pointerdown', 'keydown']);
    expect(target.load).not.toHaveBeenCalled();
  });

  it('arms the interaction listeners straight away when the page has already loaded', () => {
    const host = createHost('complete');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    host.fire('keydown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(registeredTypes(host)).toEqual(['pointerdown', 'keydown']);
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('ignores an interaction before the load event while the document is interactive', () => {
    const host = createHost('interactive');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    host.fire('pointerdown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(registeredTypes(host)).toEqual(['load']);
    expect(target.load).not.toHaveBeenCalled();
  });

  it('prefetches once even when both interaction kinds fire', () => {
    const host = createHost('complete');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    host.fire('pointerdown');
    host.fire('keydown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS * 2);

    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('attaches only once however often attach is called', () => {
    const host = createHost('loading');
    const target = createTarget();
    const prefetcher = new PostLoadPrefetcher([target]);

    prefetcher.attach(host);
    prefetcher.attach(host);
    host.fire('load');
    host.fire('pointerdown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(registeredTypes(host)).toEqual(['load', 'pointerdown', 'keydown']);
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('defers the prefetch while offline and runs it on the next online event', () => {
    const host = createHost('complete');
    host.onLine = false;
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    host.fire('pointerdown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(target.load).not.toHaveBeenCalled();
    expect(host.addEventListener).toHaveBeenLastCalledWith('online', expect.any(Function), {
      once: true,
    });

    host.onLine = true;
    host.fire('online');
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('keeps loading the other targets and swallows a rejected one', async () => {
    const host = createHost('complete');
    const failing = createTarget();
    failing.load.mockRejectedValue(chunkFailure());
    const healthy = createTarget();

    new PostLoadPrefetcher([failing, healthy]).attach(host);
    host.fire('pointerdown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);
    await Promise.resolve();

    expect(failing.load).toHaveBeenCalledTimes(1);
    expect(healthy.load).toHaveBeenCalledTimes(1);
  });

  it('leaves a failed chunk loader free to retry when the page later needs it', async () => {
    const host = createHost('complete');
    const loaded = { default: buildToken() };
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(chunkFailure())
      .mockRejectedValueOnce(chunkFailure())
      .mockResolvedValue(loaded);
    const loader = new ChunkRetryLoader(importModule);

    new PostLoadPrefetcher([loader]).attach(host);
    host.fire('keydown');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);
    await jest.runAllTimersAsync();

    expect(importModule).toHaveBeenCalledTimes(2);
    await expect(loader.load()).resolves.toBe(loaded);
    expect(importModule).toHaveBeenCalledTimes(3);
  });
});
