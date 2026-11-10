import loadIsolated from '@tests/unit/utils/isolated-module';

type AuthCardStyles = (typeof import('@auth/components/auth-card/styles'))['default'];

const loadStyles = (): Promise<AuthCardStyles> =>
  loadIsolated(async () => (await import('@auth/components/auth-card/styles')).default);

describe('auth card styles', () => {
  it('matches the Figma recovery tablet card between 768 and 1439 px only', async () => {
    const styles = await loadStyles();

    expect(styles.recoveryCard).toEqual({
      '@media (min-width:768px) and (max-width:1439.95px)': {
        maxWidth: '39.75rem',
        padding: '1.9375rem 2.4375rem',
        '& form > h1 + p': { marginBottom: '1.25rem' },
        '& label': { fontSize: '1rem', lineHeight: 1.125, marginBottom: '0.5625rem' },
        '& form > button[type="submit"]': { marginBottom: '0.0625rem' },
      },
    });
  });

  it('matches the Figma challenge frames at each width', async () => {
    const styles = await loadStyles();
    const largeTitle = {
      marginTop: '-0.1875rem',
      marginBottom: '0.75rem',
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    };
    const largeSubtitle = { maxWidth: 'none', marginBottom: '1.5rem' };
    const largeCell = { borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.375rem' };

    expect(styles.challengeCard).toEqual({
      marginTop: '0.75rem',
      paddingBottom: '1.8125rem',
      '& form > h1': {
        marginBottom: '0.375rem',
        fontSize: '1.375rem',
        lineHeight: '1.625rem',
        '@media (min-width:375px)': { whiteSpace: 'nowrap' },
      },
      '& form > h1 + p': { maxWidth: '16.25rem', marginBottom: '0.8125rem' },
      '& form > button[type="submit"]': { marginTop: '1.6875rem' },
      '&& .ui-pin-input__cell': { borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.125rem' },
      '@media (min-width:768px) and (max-width:1439.95px)': {
        maxWidth: '39.75rem',
        marginTop: '-3.1875rem',
        padding: '1.9375rem 2.4375rem',
        '& form > h1': largeTitle,
        '& form > h1 + p': largeSubtitle,
        '& form > button[type="submit"]': { marginTop: '1.5rem' },
        '&& .ui-pin-input__cell': {
          '--pin-cell-width': 'calc((100cqw - 40px) / 6)',
          height: '8.125rem',
          ...largeCell,
        },
        '&& [data-challenge-toggle]': {
          marginTop: '1.5rem',
          fontSize: '1.125rem',
          lineHeight: '1.875rem',
        },
      },
      '@media (min-width:1440px)': {
        marginTop: '1.8125rem',
        marginBottom: 'auto',
        paddingBottom: '1.4375rem',
        '& form > h1': largeTitle,
        '& form > h1 + p': largeSubtitle,
        '& form > button[type="submit"]': { marginTop: '2rem' },
        '&& .ui-pin-input__cell': {
          '--pin-cell-width': 'min(64px, calc((100cqw - 40px) / 6))',
          ...largeCell,
        },
        '&& [data-challenge-toggle]': { marginTop: '1rem' },
      },
    });
  });

  it('declares no other style block', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles)).toEqual(['challengeCard', 'recoveryCard']);
  });
});
