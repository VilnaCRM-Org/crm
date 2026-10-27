import loadIsolated from '@tests/unit/utils/isolated-module';

describe('recovery codes notice styles', () => {
  it('pins the link colour, the outlined dismiss button and the shared ring', async () => {
    const { default: styles } = await loadIsolated(
      () => import('@auth/components/recovery-codes-notice/styles')
    );

    expect(styles.link).toMatchObject({
      color: '#0074B5',
      textDecoration: 'underline',
      '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' },
    });
    expect(styles.dismiss['&&']).toMatchObject({
      border: '1px solid #80878A',
      backgroundColor: '#FFFFFF',
      color: '#1B2327',
      textTransform: 'none',
      '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' },
    });
    expect(styles.notice).toMatchObject({
      border: '1px solid #E1E7EA',
      borderRadius: '0.75rem',
      backgroundColor: '#FFFFFF',
    });
    expect(styles.message.color).toBe('#1A1C1E');
  });
});
