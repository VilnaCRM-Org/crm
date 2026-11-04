import loadIsolated from '@tests/unit/utils/isolated-module';

const FOCUS_RING = { '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' } };

describe('recovery codes notice styles', () => {
  it('pins the layout, typography, link, outlined dismiss button and shared ring', async () => {
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
      dismiss: {
        '&&': {
          minWidth: 0,
          height: '2.5rem',
          padding: '0 1.25rem',
          borderRadius: '3.5625rem',
          border: '1px solid #80878A',
          backgroundColor: '#FFFFFF',
          color: '#1B2327',
          fontFamily: 'Golos',
          fontWeight: 500,
          fontSize: '0.9375rem',
          textTransform: 'none',
          '&:hover': { backgroundColor: '#F4F5F6' },
          ...FOCUS_RING,
        },
      },
    });
  });
});
