import loadIsolated from '@tests/unit/utils/isolated-module';

import {
  ERROR_PAGE_MOBILE as MOBILE,
  ERROR_PAGE_PADDINGS,
  ERROR_PAGE_TABLET as TABLET,
} from './error-page-paddings';

type ErrorPageStylesModule = typeof import('@/components/error-page/styles/error-page-styles');

const loadErrorPageStyles = async (): Promise<ErrorPageStylesModule['default']> => {
  const { default: errorPageStyles } = await loadIsolated(
    () => import('@/components/error-page/styles/error-page-styles')
  );
  return errorPageStyles;
};

describe('ErrorPageStyles', () => {
  it('builds the landmark surface that clips overflow and grows above the footer', async () => {
    const errorPageStyles = await loadErrorPageStyles();

    expect(errorPageStyles.build().landmark).toEqual({
      display: 'flex',
      flexDirection: 'column',
      flex: '1 0 auto',
      overflowX: 'clip',
      backgroundColor: '#FBFBFB',
      ...ERROR_PAGE_PADDINGS,
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

  it('reserves the mobile dot rows and their gap below the card', async () => {
    const errorPageStyles = await loadErrorPageStyles();
    const { default: geometry } =
      await import('@/components/error-page/config/error-page-geometry');
    const gapBelowCard = 19.779;
    const dotRowsHeight = 59.091;

    expect(geometry.mobile.dotRows).toEqual({
      width: 161.541,
      height: dotRowsHeight,
      gapBelowCard,
    });
    expect(errorPageStyles.build().composition[MOBILE]).toEqual({
      width: '350.348px',
      paddingBottom: `${gapBelowCard + dotRowsHeight}px`,
    });
  });

  it('builds exactly the landmark and composition tokens', async () => {
    const sheet = (await loadErrorPageStyles()).build();

    expect(Object.keys(sheet)).toEqual(['landmark', 'composition']);
  });
});
