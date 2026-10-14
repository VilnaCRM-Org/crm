import loadIsolated from '@tests/unit/utils/isolated-module';

type SignInNoticeStyles = (typeof import('@auth/components/sign-in-notice/styles'))['default'];

const loadStyles = (): Promise<SignInNoticeStyles> =>
  loadIsolated(async () => (await import('@auth/components/sign-in-notice/styles')).default);

describe('sign-in notice styles', () => {
  it('pins every evaluated token', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      notice: {
        marginBottom: '1rem',
        fontFamily: 'Golos',
        fontSize: '1rem',
        lineHeight: '1.625rem',
        color: '#1A1C1E',
      },
    });
  });
});
