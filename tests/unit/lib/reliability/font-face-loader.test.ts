import { faker } from '@faker-js/faker';

import FontFaceLoader from '@/lib/reliability/font-face-loader';
import type { FontFaceSource } from '@/lib/reliability/types/font-face-source';

const faces = { items: [{ descriptor: '400 1em Golos' }, { descriptor: '700 1em Golos' }] };

const createFonts = (): jest.Mocked<FontFaceSource> => ({
  load: jest
    .fn<Promise<FontFace[]>, [font: string, text?: string | undefined]>()
    .mockResolvedValue([]),
});

describe('FontFaceLoader', () => {
  it('requests every face once, in order, and resolves once all of them have loaded', async () => {
    const fonts = createFonts();

    await expect(new FontFaceLoader(fonts, faces).load()).resolves.toBeUndefined();

    expect(fonts.load).toHaveBeenCalledTimes(2);
    expect(fonts.load).toHaveBeenNthCalledWith(1, '400 1em Golos');
    expect(fonts.load).toHaveBeenNthCalledWith(2, '700 1em Golos');
  });

  it('stays pending until the last face has loaded', async () => {
    const fonts = createFonts();
    let releaseLast: (loaded: FontFace[]) => void = () => undefined;
    fonts.load
      .mockResolvedValueOnce([])
      .mockReturnValueOnce(new Promise<FontFace[]>((resolve) => (releaseLast = resolve)));
    let settled = false;

    const pending = new FontFaceLoader(fonts, faces).load().then(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(settled).toBe(false);
    releaseLast([]);
    await pending;
    expect(settled).toBe(true);
  });

  it('rejects when any face fails to load', async () => {
    const fonts = createFonts();
    const failure = new Error(faker.lorem.words(3));
    fonts.load.mockRejectedValueOnce(failure);

    await expect(new FontFaceLoader(fonts, faces).load()).rejects.toBe(failure);
  });

  it('turns a source that throws synchronously into a rejection', async () => {
    const fonts = createFonts();
    const failure = new TypeError(faker.lorem.words(3));
    fonts.load.mockImplementation(() => {
      throw failure;
    });

    const pending = new FontFaceLoader(fonts, faces).load();

    await expect(pending).rejects.toBe(failure);
    expect(fonts.load).toHaveBeenCalledTimes(1);
  });

  it('resolves with nothing to load when no face is given', async () => {
    const fonts = createFonts();

    await expect(new FontFaceLoader(fonts, { items: [] }).load()).resolves.toBeUndefined();
    expect(fonts.load).not.toHaveBeenCalled();
  });
});
