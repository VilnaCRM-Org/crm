import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import PostLoadPrefetcher from '@/lib/reliability/post-load-prefetcher';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';
import type { PrefetchHost } from '@/lib/reliability/types/prefetch-host';
import { buildToken } from '@tests/builders';

type HostEvent = 'load' | 'online';

interface FakeHost extends PrefetchHost {
  readyState: DocumentReadyState;
  onLine: boolean;
  readonly addEventListener: jest.Mock<void, [HostEvent, () => void, { once: true }]>;
  fire(type: HostEvent): void;
}

const PREFETCH_DELAY_MS = 2000;

const createHost = (readyState: DocumentReadyState = 'loading'): FakeHost => {
  const listeners = new Map<HostEvent, (() => void)[]>();
  const host: FakeHost = {
    readyState,
    onLine: true,
    get document(): { readonly readyState: DocumentReadyState } {
      return { readyState: host.readyState };
    },
    get navigator(): { readonly onLine: boolean } {
      return { onLine: host.onLine };
    },
    addEventListener: jest.fn<void, [HostEvent, () => void, { once: true }]>((type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    }),
    setTimeout: (handler: () => void, timeout: number): number =>
      window.setTimeout(handler, timeout),
    fire: (type: HostEvent): void => {
      (listeners.get(type) ?? []).forEach((listener) => listener());
    },
  };
  return host;
};

const createTarget = (): jest.Mocked<ModuleLoader<unknown>> => ({
  load: jest.fn().mockResolvedValue({ default: buildToken() }),
});

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk error-page failed.'), { name: 'ChunkLoadError' });

describe('PostLoadPrefetcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits for the load event and then the prefetch delay before loading every target', () => {
    const host = createHost('loading');
    const targets = [createTarget(), createTarget()];

    new PostLoadPrefetcher(targets).attach(host);
    jest.advanceTimersByTime(PREFETCH_DELAY_MS * 2);

    targets.forEach((target) => expect(target.load).not.toHaveBeenCalled());
    expect(host.addEventListener).toHaveBeenCalledTimes(1);
    expect(host.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), {
      once: true,
    });

    host.fire('load');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS - 1);
    targets.forEach((target) => expect(target.load).not.toHaveBeenCalled());

    jest.advanceTimersByTime(1);
    targets.forEach((target) => expect(target.load).toHaveBeenCalledTimes(1));
  });

  it('schedules straight away when the page has already loaded', () => {
    const host = createHost('complete');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);

    expect(host.addEventListener).not.toHaveBeenCalled();
    jest.advanceTimersByTime(PREFETCH_DELAY_MS - 1);
    expect(target.load).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('waits for the load event while the document is still interactive', () => {
    const host = createHost('interactive');
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(target.load).not.toHaveBeenCalled();
    expect(host.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), {
      once: true,
    });
  });

  it('attaches only once however often attach is called', () => {
    const host = createHost('loading');
    const target = createTarget();
    const prefetcher = new PostLoadPrefetcher([target]);

    prefetcher.attach(host);
    prefetcher.attach(host);
    host.fire('load');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(host.addEventListener).toHaveBeenCalledTimes(1);
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('skips the prefetch while offline and re-arms on the next online event', () => {
    const host = createHost('complete');
    host.onLine = false;
    const target = createTarget();

    new PostLoadPrefetcher([target]).attach(host);
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);

    expect(target.load).not.toHaveBeenCalled();
    expect(host.addEventListener).toHaveBeenCalledTimes(1);
    expect(host.addEventListener).toHaveBeenCalledWith('online', expect.any(Function), {
      once: true,
    });

    host.onLine = true;
    host.fire('online');
    jest.advanceTimersByTime(PREFETCH_DELAY_MS - 1);
    expect(target.load).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(target.load).toHaveBeenCalledTimes(1);
  });

  it('keeps loading the other targets and swallows a rejected one', async () => {
    const host = createHost('complete');
    const failing = createTarget();
    failing.load.mockRejectedValue(chunkFailure());
    const healthy = createTarget();

    new PostLoadPrefetcher([failing, healthy]).attach(host);
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
    jest.advanceTimersByTime(PREFETCH_DELAY_MS);
    await jest.runAllTimersAsync();

    expect(importModule).toHaveBeenCalledTimes(2);
    await expect(loader.load()).resolves.toBe(loaded);
    expect(importModule).toHaveBeenCalledTimes(3);
  });
});
