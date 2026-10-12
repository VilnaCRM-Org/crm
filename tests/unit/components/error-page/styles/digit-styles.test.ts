import loadIsolated from '@tests/unit/utils/isolated-module';

type DigitStylesModule = typeof import('@/components/error-page/styles/digit-styles');

const loadDigitStyles = (): Promise<DigitStylesModule> =>
  loadIsolated(() => import('@/components/error-page/styles/digit-styles'));

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';

const LARGE_DIGITS = {
  width: '466px',
  height: '330px',
  fontSize: '244.5px',
  lineHeight: '293.4px',
  textShadow: '0 4px 0 var(--error-page-digit-shadow)',
};

const LARGE_GLYPHS = {
  '& > span:nth-of-type(1)': { left: '0px', top: '0px' },
  '& > span:nth-of-type(2)': { left: '147px', top: '36px' },
  '& > span:nth-of-type(3)': { left: '301px', top: '0px' },
};

describe('ErrorPageDigitStyles', () => {
  it('names the custom property that carries the variant shadow colour', async () => {
    const { ERROR_PAGE_DIGIT_SHADOW_VAR } = await loadDigitStyles();

    expect(ERROR_PAGE_DIGIT_SHADOW_VAR).toBe('--error-page-digit-shadow');
  });

  it('builds the Golos 700 digit frame with size and shadow per breakpoint', async () => {
    const { default: digitStyles } = await loadDigitStyles();

    expect(digitStyles.build().digits).toEqual({
      position: 'relative',
      zIndex: 3,
      flexShrink: 0,
      fontFamily: 'Golos, sans-serif',
      fontWeight: 700,
      letterSpacing: 0,
      '& > span': { position: 'absolute' },
      ...LARGE_DIGITS,
      [TABLET]: LARGE_DIGITS,
      [MOBILE]: {
        width: '344.435px',
        height: '243.913px',
        fontSize: '154.462px',
        lineHeight: '185.355px',
        textShadow: '0 2.527px 0 var(--error-page-digit-shadow)',
      },
    });
  });

  it('places the three glyphs left-aligned with the middle one dropped', async () => {
    const { default: digitStyles } = await loadDigitStyles();

    expect(digitStyles.build().glyphs).toEqual({
      ...LARGE_GLYPHS,
      [TABLET]: LARGE_GLYPHS,
      [MOBILE]: {
        '& > span:nth-of-type(1)': { left: '27.739px', top: '14.582px' },
        '& > span:nth-of-type(2)': { left: '120.606px', top: '37.324px' },
        '& > span:nth-of-type(3)': { left: '217.896px', top: '14.582px' },
      },
    });
  });

  it('builds exactly the digits and glyphs tokens', async () => {
    const { default: digitStyles } = await loadDigitStyles();

    expect(Object.keys(digitStyles.build())).toEqual(['digits', 'glyphs']);
  });
});
