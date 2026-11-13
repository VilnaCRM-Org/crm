import loadIsolated from '@tests/unit/utils/isolated-module';

const FOCUS_RING = { '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' } };

describe('recovery codes notice styles', () => {
  it('pins the layout, typography, link and shared ring', async () => {
    const { default: styles } = await loadIsolated(
      () => import('@auth/components/recovery-codes-notice/styles')
    );

    expect(styles).toEqual({
      notice: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem 1.5rem',
        marginTop: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '0.75rem',
        fontFamily: 'Golos',
      },
      message: {
        flex: '1 1 16rem',
        margin: 0,
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: '1.5rem',
        color: '#1A1C1E',
      },
      actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem' },
      link: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: '1.5rem',
        color: '#0074B5',
        textDecoration: 'underline',
        ...FOCUS_RING,
      },
    });
  });
});
