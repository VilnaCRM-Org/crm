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
  it('lays the mobile buttons out column-first in two rows, then as one row from md', async () => {
    const styles = await loadStyles();

    expect(styles.servicesList).toEqual({
      padding: 0,
      '& .MuiButton-root': {
        margin: 0,
      },
      '@media (min-width:375px)': {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
    });
  });

  it('pins the 58px desktop and 75px tablet button paddings', async () => {
    const styles = await loadStyles();

    expect(styles.serviceItemButton).toMatchObject({
      padding: '1.0625rem 4.0625rem',
      '@media (min-width:1024px)': {
        padding: '1.3125rem 3rem 1.25rem',
      },
      '@media (min-width:1440px)': {
        padding: '17px 39px',
      },
    });
  });

  it('keeps 24px between the submit button and the divider from the lg breakpoint', async () => {
    const styles = await loadStyles();

    expect(styles.thirdPartyWrapper).toEqual({
      marginTop: '1.0625rem',
      '@media (min-width:1024px)': {
        marginTop: '1.5rem',
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
