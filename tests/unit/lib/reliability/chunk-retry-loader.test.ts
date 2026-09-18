import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import { buildToken } from '@tests/builders';

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk 3 failed.'), { name: 'ChunkLoadError' });

describe('ChunkRetryLoader', () => {
  it('resolves with the imported module and shares one promise across callers', async () => {
    const loaded = { default: buildToken() };
    const importModule = jest.fn().mockResolvedValue(loaded);
    const loader = new ChunkRetryLoader(importModule);

    const first = loader.load();
    const second = loader.load();

    expect(first).toBe(second);
    await expect(first).resolves.toBe(loaded);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('keeps returning the settled promise on later calls', async () => {
    const importModule = jest.fn().mockResolvedValue({ default: buildToken() });
    const loader = new ChunkRetryLoader(importModule);

    await loader.load();
    await loader.load();

    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('retries a chunk-load failure once and resolves with the second import', async () => {
    const loaded = { default: buildToken() };
    const importModule = jest.fn().mockRejectedValueOnce(chunkFailure()).mockResolvedValue(loaded);
    const loader = new ChunkRetryLoader(importModule);

    await expect(loader.load()).resolves.toBe(loaded);

    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it('rethrows the second chunk-load failure instead of retrying again', async () => {
    const second = chunkFailure();
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(chunkFailure())
      .mockRejectedValueOnce(second);
    const loader = new ChunkRetryLoader(importModule);

    await expect(loader.load()).rejects.toBe(second);

    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it('does not retry a failure that is not a chunk-load failure', async () => {
    const failure = new Error('module evaluation threw');
    const importModule = jest.fn().mockRejectedValue(failure);
    const loader = new ChunkRetryLoader(importModule);

    await expect(loader.load()).rejects.toBe(failure);

    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('forgets a failed load so the next call imports again', async () => {
    const loaded = { default: buildToken() };
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(loaded);
    const loader = new ChunkRetryLoader(importModule);

    await expect(loader.load()).rejects.toThrow('boom');
    const next = loader.load();

    expect(loader.load()).toBe(next);
    await expect(next).resolves.toBe(loaded);
    expect(importModule).toHaveBeenCalledTimes(2);
  });
});
