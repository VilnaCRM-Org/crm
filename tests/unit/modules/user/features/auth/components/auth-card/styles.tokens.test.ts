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

  it('declares no other style block', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles)).toEqual(['recoveryCard']);
  });
});
