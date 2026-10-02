import loadIsolated from '@tests/unit/utils/isolated-module';

type CardStylesModule = typeof import('@/components/error-page/card-styles');

const loadCardStyles = async (): Promise<CardStylesModule['default']> => {
  const { default: cardStyles } = await loadIsolated(
    () => import('@/components/error-page/card-styles')
  );
  return cardStyles;
};

const TABLET = '@media (max-width: 1024px)';
const MOBILE = '@media (max-width:767.95px)';
const SHADOW = 'rgba(55, 64, 78, 0.07)';

describe('ErrorPageCardStyles', () => {
  it('builds the card border, radius, shadow and rhythm per breakpoint', async () => {
    const cardStyles = await loadCardStyles();

    expect(cardStyles.build().card).toEqual({
      position: 'relative',
      zIndex: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: '#FFFFFF',
      borderStyle: 'solid',
      borderColor: '#EAECEE',
      borderWidth: '1px',
      borderRadius: '16px',
      boxShadow: `0 4px 31px 0 ${SHADOW}`,
      padding: '28px 0 31px',
      [TABLET]: {
        borderWidth: '1px',
        borderRadius: '16px',
        boxShadow: `0 4px 31px 0 ${SHADOW}`,
        padding: '23px 0 39px',
      },
      [MOBILE]: {
        borderWidth: '0.739px',
        borderRadius: '11.826px',
        boxShadow: `0 2.957px 22.913px 0 ${SHADOW}`,
        padding: '25.737px 0 25.741px',
      },
    });
  });

  it('sizes and insets the title and drops the ring of its programmatic focus', async () => {
    const cardStyles = await loadCardStyles();

    expect(cardStyles.build().title).toEqual({
      margin: 0,
      fontFamily: 'Golos, sans-serif',
      letterSpacing: 0,
      textAlign: 'center',
      color: '#000000',
      '&:focus': { outline: 'none' },
      maxWidth: 'calc(100% - 48px)',
      fontSize: '2.25rem',
      lineHeight: '2.6875rem',
      fontWeight: 600,
      [TABLET]: {
        maxWidth: 'calc(100% - 48px)',
        fontSize: '2.25rem',
        lineHeight: '2.6875rem',
        fontWeight: 600,
      },
      [MOBILE]: {
        maxWidth: 'calc(100% - 32px)',
        fontSize: '1.375rem',
        lineHeight: '1.625rem',
        fontWeight: 700,
      },
    });
  });

  it('sizes the description in rem with the card rhythm gaps and text inset', async () => {
    const cardStyles = await loadCardStyles();

    expect(cardStyles.build().description).toEqual({
      fontFamily: 'Golos, sans-serif',
      fontWeight: 400,
      letterSpacing: 0,
      textAlign: 'center',
      color: '#1A1C1E',
      maxWidth: 'calc(100% - 48px)',
      margin: '6px 0 24px',
      fontSize: '1rem',
      lineHeight: '1.625rem',
      [TABLET]: {
        maxWidth: 'calc(100% - 48px)',
        margin: '4px 0 24px',
        fontSize: '1.125rem',
        lineHeight: '1.875rem',
      },
      [MOBILE]: {
        maxWidth: 'calc(100% - 32px)',
        margin: '3.74px 0 16px',
        fontSize: '0.9375rem',
        lineHeight: '1.5625rem',
      },
    });
  });

  it('hides the status code visually with the clip pattern while keeping it readable', async () => {
    const cardStyles = await loadCardStyles();

    expect(cardStyles.build().statusCode).toEqual({
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: 0,
      border: 0,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    });
  });

  it('builds exactly the four card tokens and never clips the card overflow', async () => {
    const sheet = (await loadCardStyles()).build();

    expect(Object.keys(sheet)).toEqual(['card', 'title', 'description', 'statusCode']);
    expect(sheet.card).not.toHaveProperty('overflow');
  });
});
