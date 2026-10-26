import loadIsolated from '@tests/unit/utils/isolated-module';

type ComingSoonStylesModule = typeof import('@/components/coming-soon/styles');

const loadStyles = async (): Promise<ComingSoonStylesModule['default']> => {
  const { default: comingSoonStyles } = await loadIsolated(
    () => import('@/components/coming-soon/styles')
  );
  return comingSoonStyles;
};

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';

describe('ComingSoonStyles', () => {
  it('builds a page surface that grows beside the shell with the error-page paddings', async () => {
    const comingSoonStyles = await loadStyles();

    expect(comingSoonStyles.build().page).toEqual({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: '1 0 auto',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: '#FBFBFB',
      paddingTop: '76px',
      paddingBottom: '121px',
      [TABLET]: { paddingTop: '76px', paddingBottom: '121px' },
      [MOBILE]: { paddingTop: '43.61px', paddingBottom: '73.91px' },
    });
  });

  it('builds a frame of the composition width per breakpoint that never overflows', async () => {
    const comingSoonStyles = await loadStyles();

    expect(comingSoonStyles.build().frame).toEqual({
      maxWidth: 'calc(100% - 24.6px)',
      width: '614px',
      [TABLET]: { width: '474px' },
      [MOBILE]: { width: '350.348px' },
    });
  });

  it('builds exactly the page and frame tokens', async () => {
    const sheet = (await loadStyles()).build();

    expect(Object.keys(sheet)).toEqual(['page', 'frame']);
  });
});
