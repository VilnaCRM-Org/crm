import type Styles from '@auth/components/form-section/components/auth-provider-buttons/styles';
import type Theme from '@auth/components/form-section/components/auth-provider-buttons/theme';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadStyles = (): Promise<typeof Styles> =>
  loadIsolated(
    async () =>
      (await import('@auth/components/form-section/components/auth-provider-buttons/styles'))
        .default
  );

const loadTheme = (): Promise<typeof Theme> =>
  loadIsolated(
    async () =>
      (await import('@auth/components/form-section/components/auth-provider-buttons/theme')).default
  );

describe('auth provider buttons styles', () => {
  it('pins every styles token, including the column-first two-row mobile grid', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      thirdPartyWrapper: {
        marginTop: '1.0625rem',
        '@media (min-width:1024px)': {
          marginTop: '1.5rem',
        },
      },
      dividerText: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontStyle: 'normal',
        fontSize: '0.875rem',
        lineHeight: '1.125rem',
        letterSpacing: 0,
        textTransform: 'uppercase',
        color: '#57595B',
        '@media (min-width:1024px)': {
          fontWeight: 400,
          fontSize: '1.125rem',
        },
        '@media (min-width:1440px)': {
          fontWeight: 500,
          fontSize: '0.875rem',
          lineHeight: '1.125rem',
        },
      },
      servicesList: {
        padding: 0,
        '& .MuiButton-root': {
          margin: 0,
        },
        '@media (min-width:375px)': {
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 154fr) minmax(0, 153fr)',
          gridTemplateRows: 'repeat(2, auto)',
          gridAutoFlow: 'column',
          gap: '0.5rem',
        },
        '@media (min-width:768px)': {
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          gap: 0,
        },
      },
      servicesItem: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderRadius: '0.75rem',
        '@media (max-width:374px)': {
          '&:not(:last-child)': {
            marginBottom: '1rem',
          },
        },
        '@media (min-width:768px)': {
          maxWidth: '8.0625rem',
        },
        '@media (min-width:1440px)': {
          maxWidth: '6.25rem',
        },
      },
      serviceItemButton: {
        width: '100%',
        height: '100%',
        padding: '1.0625rem 4.0625rem',
        '&:hover, &:focus-visible': {
          borderColor: '#1EAEFF',
        },
        '@media (min-width:1024px)': {
          padding: '1.3125rem 3rem 1.25rem',
        },
        '@media (min-width:1440px)': {
          padding: '17px 39px',
        },
      },
      serviceItemButtonIcon: {
        width: '1.375rem',
        height: '1.375rem',
        '@media (min-width:768px)': {
          width: '2rem',
          height: '2rem',
        },
        '@media (min-width:1440px)': {
          width: '1.375rem',
          height: '1.375rem',
        },
      },
    });
  });
});

describe('auth provider buttons theme', () => {
  it('draws both divider rules in the stroke token', async () => {
    const theme = await loadTheme();
    const root = theme.components?.MuiDivider?.styleOverrides?.root as Record<string, unknown>;

    expect(root['&::before, &::after']).toEqual({ borderTopColor: '#D0D4D8' });
  });
});
