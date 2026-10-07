import loadIsolated from '@tests/unit/utils/isolated-module';

type ActionStylesModule = typeof import('@/components/error-page/styles/action-styles');

const loadActionStyles = (): Promise<ActionStylesModule> =>
  loadIsolated(() => import('@/components/error-page/styles/action-styles'));

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';
const THEME_PHONE = '@media (max-width: 375px)';
const WHITE = '#FFFFFF';
const BORDER_GREY = '#969B9D';

const SHARED_BASE = {
  fontFamily: 'Golos, sans-serif',
  textTransform: 'none',
  letterSpacing: 0,
  borderRadius: '57px',
  boxShadow: 'none',
  maxWidth: '100%',
  boxSizing: 'border-box',
  '&:focus-visible': {
    outline: '2px solid #1A1C1E',
    outlineOffset: '2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '& .MuiTouchRipple-root': { display: 'none' },
  },
};

const DESKTOP_LABEL = { fontSize: '1.125rem', lineHeight: '1.375rem', fontWeight: 600 };
const MOBILE_LABEL = { fontSize: '0.9375rem', lineHeight: '1.125rem', fontWeight: 500 };

const MOBILE_OUTLINED = { minHeight: '50px', padding: '15px 23px', ...MOBILE_LABEL };

describe('ErrorPageActionStyles', () => {
  it('stretches only the stacked actions to the row width on mobile', async () => {
    const { default: actionStyles } = await loadActionStyles();

    expect(actionStyles.build().stacked).toEqual({ [MOBILE]: { width: '100%' } });
  });

  it('lays the actions out in a centred row, a column inset 20px on mobile', async () => {
    const { default: actionStyles } = await loadActionStyles();

    expect(actionStyles.build().row).toEqual({
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      paddingInline: '4px',
      boxSizing: 'border-box',
      [MOBILE]: {
        flexDirection: 'column',
        gap: '6px',
        paddingInline: '19.261px',
      },
    });
  });

  it('sizes the contained action per breakpoint from the geometry table', async () => {
    const { default: actionStyles } = await loadActionStyles();

    expect(actionStyles.build().contained).toEqual({
      ...SHARED_BASE,
      color: WHITE,
      minHeight: '62px',
      padding: '20px 32px',
      ...DESKTOP_LABEL,
      [TABLET]: { minHeight: '70px', padding: '24px 44px', ...DESKTOP_LABEL },
      [MOBILE]: { minHeight: '50px', padding: '16px 24px', ...MOBILE_LABEL },
    });
  });

  it('draws the outlined action with its border inside the button height', async () => {
    const { default: actionStyles } = await loadActionStyles();

    expect(actionStyles.build().outlined).toEqual({
      ...SHARED_BASE,
      backgroundColor: WHITE,
      border: `1px solid ${BORDER_GREY}`,
      color: '#1B2327',
      '&:hover': { backgroundColor: WHITE, borderColor: BORDER_GREY },
      minHeight: '62px',
      padding: '19px 31px',
      ...DESKTOP_LABEL,
      [TABLET]: { minHeight: '70px', padding: '23px 43px', ...DESKTOP_LABEL },
      [MOBILE]: MOBILE_OUTLINED,
      [THEME_PHONE]: { ...MOBILE_OUTLINED, marginBottom: 0 },
    });
  });

  it('re-pins the UIButton theme queries after the breakpoint blocks so they win', async () => {
    const { default: actionStyles } = await loadActionStyles();

    const mediaKeys = Object.keys(actionStyles.build().outlined).filter((key) =>
      key.startsWith('@media (max-width')
    );

    expect(mediaKeys).toEqual([TABLET, MOBILE, THEME_PHONE]);
  });
});
