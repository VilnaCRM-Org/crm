import loadIsolated from '@tests/unit/utils/isolated-module';

type ResponsiveStylesModule = typeof import('@/components/error-page/responsive-styles');

const loadResponsiveStyles = (): Promise<ResponsiveStylesModule> =>
  loadIsolated(() => import('@/components/error-page/responsive-styles'));

describe('ErrorPageResponsiveStyles', () => {
  it('places the desktop fragment at the top level and the rest under media queries', async () => {
    const { default: responsiveStyles } = await loadResponsiveStyles();

    const composed = responsiveStyles.compose(
      { width: '614px', display: 'block' },
      { width: '474px' },
      { width: '350.348px', display: 'none' }
    );

    expect(composed).toEqual({
      width: '614px',
      display: 'block',
      '@media (max-width: 1024px)': { width: '474px' },
      '@media (max-width:767.95px)': { width: '350.348px', display: 'none' },
    });
  });

  it('keeps the tablet block ahead of the mobile block so the narrower query wins', async () => {
    const { default: responsiveStyles } = await loadResponsiveStyles();

    const composed = responsiveStyles.compose({}, { top: 1 }, { top: 2 });

    expect(Object.keys(composed)).toEqual([
      '@media (max-width: 1024px)',
      '@media (max-width:767.95px)',
    ]);
  });
});
