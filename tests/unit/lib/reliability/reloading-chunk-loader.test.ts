import type ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import type ReloadOnceGuard from '@/lib/reliability/reload-once-guard';
import ReloadingChunkLoader from '@/lib/reliability/reloading-chunk-loader';
import { buildToken } from '@tests/builders';

type Page = { default: string };

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk 9 failed.'), { name: 'ChunkLoadError' });

const createGuard = (allow: boolean): jest.Mocked<ReloadOnceGuard> =>
  ({ allow: jest.fn().mockReturnValue(allow), reset: jest.fn() }) as never;

const createInner = (load: jest.Mock): ChunkRetryLoader<Page> => ({ load }) as never;

const isPending = async (promise: Promise<unknown>): Promise<boolean> => {
  const sentinel = Symbol('pending');
  return (await Promise.race([promise, Promise.resolve(sentinel)])) === sentinel;
};

describe('ReloadingChunkLoader', () => {
  let reload: jest.SpyInstance;

  beforeEach(() => {
    reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves with the loaded page and clears the reload flag for its key', async () => {
    const loaded: Page = { default: buildToken() };
    const guard = createGuard(true);
    const key = buildToken();
    const loader = new ReloadingChunkLoader(
      key,
      createInner(jest.fn().mockResolvedValue(loaded)),
      guard
    );

    await expect(loader.load()).resolves.toBe(loaded);

    expect(guard.reset).toHaveBeenCalledWith(key);
    expect(guard.allow).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once for a chunk failure the guard allows and stays pending', async () => {
    const guard = createGuard(true);
    const key = buildToken();
    const loader = new ReloadingChunkLoader(
      key,
      createInner(jest.fn().mockRejectedValue(chunkFailure())),
      guard
    );

    const pending = loader.load();

    await expect(isPending(pending)).resolves.toBe(true);
    expect(guard.allow).toHaveBeenCalledWith(key);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(guard.reset).not.toHaveBeenCalled();
  });

  it('rethrows a chunk failure when the guard refuses a second reload', async () => {
    const failure = chunkFailure();
    const guard = createGuard(false);
    const loader = new ReloadingChunkLoader(
      buildToken(),
      createInner(jest.fn().mockRejectedValue(failure)),
      guard
    );

    await expect(loader.load()).rejects.toBe(failure);

    expect(reload).not.toHaveBeenCalled();
  });

  it('rethrows a non-chunk failure without consulting the guard or reloading', async () => {
    const failure = new Error('render-time module error');
    const guard = createGuard(true);
    const loader = new ReloadingChunkLoader(
      buildToken(),
      createInner(jest.fn().mockRejectedValue(failure)),
      guard
    );

    await expect(loader.load()).rejects.toBe(failure);

    expect(guard.allow).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});
