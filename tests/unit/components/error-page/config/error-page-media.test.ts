import loadIsolated from '@tests/unit/utils/isolated-module';

type ErrorPageMediaModule = typeof import('@/components/error-page/config/error-page-media');

const loadMedia = (): Promise<ErrorPageMediaModule> =>
  loadIsolated(() => import('@/components/error-page/config/error-page-media'));

describe('error page media queries', () => {
  it('builds the tablet query from the lg breakpoint', async () => {
    const { default: media } = await loadMedia();

    expect(media.tablet).toBe('@media (max-width: 1024px)');
  });

  it('builds the mobile query from the md breakpoint', async () => {
    const { default: media } = await loadMedia();

    expect(media.mobile).toBe('@media (max-width:767.95px)');
  });

  it('holds exactly the two breakpoint queries', async () => {
    const { default: media } = await loadMedia();

    expect(Object.keys(media)).toEqual(['tablet', 'mobile']);
  });
});
