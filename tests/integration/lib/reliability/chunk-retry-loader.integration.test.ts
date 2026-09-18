import '../../setup';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

const chunkFailure = (): Error =>
  Object.assign(new TypeError('Failed to fetch dynamically imported module: /page.js'), {
    name: 'TypeError',
  });

describe('ChunkRetryLoader (integration with the chunk-load detector)', () => {
  it('retries a browser-shaped dynamic-import failure once and shares the result', async () => {
    const loaded = { default: 'page' };
    const importModule = jest.fn().mockRejectedValueOnce(chunkFailure()).mockResolvedValue(loaded);
    const loader = new ChunkRetryLoader(importModule);

    const first = loader.load();
    expect(loader.load()).toBe(first);
    await expect(first).resolves.toBe(loaded);
    await expect(loader.load()).resolves.toBe(loaded);

    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it('rethrows a non-chunk failure, then forgets it so the next load imports again', async () => {
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(new Error('module threw at evaluation'))
      .mockResolvedValue({ default: 'page' });
    const loader = new ChunkRetryLoader(importModule);

    await expect(loader.load()).rejects.toThrow('module threw at evaluation');
    await expect(loader.load()).resolves.toEqual({ default: 'page' });

    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it('recognises the bundler ChunkLoadError name as well as the browser message', async () => {
    const loaded = { default: 'page' };
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'ChunkLoadError' }))
      .mockResolvedValue(loaded);

    await expect(new ChunkRetryLoader(importModule).load()).resolves.toBe(loaded);
    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it.each(['boom', undefined, { name: 'TypeError', message: ['Loading chunk 1 failed.'] }])(
    'does not retry the non-chunk rejection %p',
    async (rejection) => {
      const importModule = jest.fn().mockRejectedValue(rejection);

      await expect(new ChunkRetryLoader(importModule).load()).rejects.toBe(rejection);
      expect(importModule).toHaveBeenCalledTimes(1);
    }
  );

  it('rethrows the second chunk failure in a row', async () => {
    const second = chunkFailure();
    const importModule = jest
      .fn()
      .mockRejectedValueOnce(chunkFailure())
      .mockRejectedValueOnce(second);

    await expect(new ChunkRetryLoader(importModule).load()).rejects.toBe(second);
  });
});
