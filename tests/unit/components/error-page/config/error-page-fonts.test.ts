import loadIsolated from '@tests/unit/utils/isolated-module';

describe('ERROR_PAGE_FONT_FACES', () => {
  it('lists every Golos weight the error page renders, as CSS font shorthands', async () => {
    const faces = await loadIsolated(
      async () => (await import('@/components/error-page/config/error-page-fonts')).default
    );

    expect(faces).toEqual({
      items: [
        { descriptor: '400 1em Golos' },
        { descriptor: '500 1em Golos' },
        { descriptor: '600 1em Golos' },
        { descriptor: '700 1em Golos' },
      ],
    });
  });
});
