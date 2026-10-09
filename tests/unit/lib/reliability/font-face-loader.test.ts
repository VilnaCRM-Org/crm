import { faker } from '@faker-js/faker';

import FontFaceLoader from '@/lib/reliability/font-face-loader';
import type { FontFaceSource } from '@/lib/reliability/types/font-face-source';

const faces = ['400 1em Golos', '700 1em Golos'];

const createFonts = (): jest.Mocked<FontFaceSource> => ({
  load: jest.fn((face: string) => Promise.resolve([face])),
});

describe('FontFaceLoader', () => {
  it('requests every face once, in order, and resolves with each result', async () => {
    const fonts = createFonts();

    await expect(new FontFaceLoader(fonts, faces).load()).resolves.toEqual([
      ['400 1em Golos'],
      ['700 1em Golos'],
    ]);

    expect(fonts.load).toHaveBeenCalledTimes(2);
    expect(fonts.load).toHaveBeenNthCalledWith(1, '400 1em Golos');
    expect(fonts.load).toHaveBeenNthCalledWith(2, '700 1em Golos');
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

    await expect(new FontFaceLoader(fonts, []).load()).resolves.toEqual([]);
    expect(fonts.load).not.toHaveBeenCalled();
  });
});
