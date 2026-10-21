import loadIsolated from '@tests/unit/utils/isolated-module';

type SignInNoticeStyles = (typeof import('@auth/components/sign-in-notice/styles'))['default'];

const loadStyles = (): Promise<SignInNoticeStyles> =>
  loadIsolated(async () => (await import('@auth/components/sign-in-notice/styles')).default);

describe('sign-in notice styles', () => {
  it('pins every evaluated token', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      notice: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        margin: '0 0 1rem',
        fontFamily: 'Golos',
        fontWeight: 500,
        fontSize: '0.9375rem',
        lineHeight: '1.375rem',
        letterSpacing: 0,
        color: '#2E7D32',
      },
      icon: {
        flexShrink: 0,
        fontSize: '1.375rem',
      },
    });
  });
});
