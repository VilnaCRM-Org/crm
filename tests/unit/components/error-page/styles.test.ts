import loadIsolated from '@tests/unit/utils/isolated-module';

type ErrorPageStylesModule = typeof import('@/components/error-page/styles');

const loadErrorPageStyles = async (): Promise<ErrorPageStylesModule['default']> => {
  const { default: errorPageStyles } = await loadIsolated(
    () => import('@/components/error-page/styles')
  );
  return errorPageStyles;
};

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';

describe('ErrorPageStyles', () => {
  it('builds the landmark surface that clips overflow and grows above the footer', async () => {
    const errorPageStyles = await loadErrorPageStyles();

    expect(errorPageStyles.build().landmark).toEqual({
      display: 'flex',
      flexDirection: 'column',
      flex: '1 0 auto',
      overflowX: 'clip',
      backgroundColor: '#FBFBFB',
      paddingTop: '76px',
      paddingBottom: '121px',
      [TABLET]: { paddingTop: '76px', paddingBottom: '121px' },
      [MOBILE]: { paddingTop: '43.61px', paddingBottom: '73.91px' },
    });
  });

  it('builds a fixed-width composition centred by auto margins per breakpoint', async () => {
    const errorPageStyles = await loadErrorPageStyles();

    expect(errorPageStyles.build().composition).toEqual({
      position: 'relative',
      isolation: 'isolate',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: 'calc(100% - 24.6px)',
      marginInline: 'auto',
      width: '614px',
      paddingBottom: '0px',
      [TABLET]: { width: '474px', paddingBottom: '0px' },
      [MOBILE]: { width: '350.348px', paddingBottom: '78.87px' },
    });
  });

  it('builds exactly the landmark and composition tokens', async () => {
    const sheet = (await loadErrorPageStyles()).build();

    expect(Object.keys(sheet)).toEqual(['landmark', 'composition']);
  });
});
