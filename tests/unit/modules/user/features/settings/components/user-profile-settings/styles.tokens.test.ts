import type s from '@/modules/user/features/settings/components/user-profile-settings/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type CardStyles = typeof s;

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';
const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };
const OUTLINED_PILL = {
  minWidth: 0,
  maxHeight: 'none',
  margin: 0,
  padding: '0 1.5rem',
  borderRadius: '3.5625rem',
  fontFamily: 'Golos',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  letterSpacing: 0,
  textTransform: 'none',
  '&:focus-visible': RING,
  border: '1px solid #969B9D',
  backgroundColor: '#FFFFFF',
  color: '#1A1C1E',
  '&:hover': { backgroundColor: '#F4F5F6' },
};
const PILL_FROM_TABLET = { fontWeight: 600, fontSize: '1.125rem', lineHeight: 'normal' };

const loadStyles = (): Promise<CardStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/user-profile-settings/styles'))
        .default
  );

describe('user profile settings styles', () => {
  it('draws the card on white with the brand-grey border, 8 px in from a phone edge', async () => {
    const { card } = await loadStyles();

    expect(card).toEqual({
      '--settings-card-inset-start': '1.0625rem',
      '--settings-card-inset-end': '1rem',
      marginInline: '-0.4375rem',
      padding:
        '1.4375rem var(--settings-card-inset-end) 0.9375rem var(--settings-card-inset-start)',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E1E7EA',
      borderRadius: '0.75rem',
      [TABLET]: {
        '--settings-card-inset-start': '1.9375rem',
        '--settings-card-inset-end': '1.9375rem',
        marginInline: 0,
        paddingTop: '1.1875rem',
      },
      [DESKTOP]: {
        '--settings-card-inset-end': '1.4375rem',
        paddingTop: '1.0625rem',
        paddingBottom: '1.1875rem',
      },
    });
  });

  it('stops every skeleton animation under prefers-reduced-motion: reduce', async () => {
    const { skeleton } = await loadStyles();

    expect(skeleton).toEqual({
      '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none' } },
    });
  });

  it('sizes the skeleton header like the loaded one at each layout', async () => {
    const styles = await loadStyles();

    expect(styles.skeletonMonogram).toEqual({
      flexShrink: 0,
      width: '4rem',
      height: '4rem',
      [TABLET]: { width: '6.1875rem', height: '6.1875rem' },
    });
    expect(styles.skeletonLines).toEqual({ flex: 1 });
    expect(styles.skeletonGreeting).toEqual({
      width: '9.75rem',
      maxWidth: '100%',
      height: '1.125rem',
    });
    expect(styles.skeletonName).toEqual({
      width: '11.875rem',
      maxWidth: '100%',
      height: '1.375rem',
      [TABLET]: { height: '1.625rem' },
    });
    expect(styles.skeletonTitle).toEqual({
      width: '8.75rem',
      height: '1.375rem',
      [TABLET]: { width: '10.8125rem', height: '1.625rem' },
    });
  });

  it('lays each skeleton field out like the loaded one, a centred row from 768 px', async () => {
    const styles = await loadStyles();

    expect(styles.skeletonField).toEqual({
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      marginBottom: '1rem',
      [TABLET]: { flexDirection: 'row', alignItems: 'center', gap: 0, marginBottom: '0.8125rem' },
      [DESKTOP]: { marginBottom: '0.75rem' },
    });
    expect(styles.skeletonLabel).toEqual({
      flexShrink: 0,
      width: '8.75rem',
      height: '1.125rem',
      [TABLET]: { width: '8rem', height: '1.375rem', marginRight: '2.8125rem' },
      [DESKTOP]: { width: '7.5rem', height: '1.125rem', marginRight: '2rem' },
    });
    expect(styles.skeletonInput).toEqual({
      height: '3rem',
      [TABLET]: { flex: '1 1 0', minWidth: 0, height: '4.375rem' },
      [DESKTOP]: { height: '4rem' },
    });
  });

  it('sizes the skeleton pills like Save and Clear at each layout', async () => {
    const styles = await loadStyles();

    expect(styles.skeletonActions).toEqual({
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      [TABLET]: { flexDirection: 'row', gap: '0.5rem' },
    });
    expect(styles.skeletonPill).toEqual({
      width: '100%',
      height: '3.125rem',
      [TABLET]: { flex: 1, height: '4.375rem' },
    });
    expect(styles.skeletonSave).toEqual({
      [DESKTOP]: { flex: '0 0 16.875rem', height: '3.875rem' },
    });
    expect(styles.skeletonClear).toEqual({
      [DESKTOP]: { flex: '0 0 11.25rem', height: '3.875rem' },
    });
  });

  it('stacks the failure message over its retry button in Golos', async () => {
    const { errorMessage, error } = await loadStyles();

    expect(error).toEqual({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1rem',
      fontFamily: 'Golos',
    });
    expect(errorMessage).toEqual({
      margin: 0,
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 'normal',
      color: '#1A1C1E',
    });
  });

  it('draws the retry button as the outlined pill with the repository focus ring', async () => {
    const { retryButton } = await loadStyles();

    expect(retryButton).toEqual({
      '&&': {
        ...OUTLINED_PILL,
        width: '100%',
        height: '3.125rem',
        [TABLET]: { ...PILL_FROM_TABLET, width: 'auto', minWidth: '11.25rem', height: '4.375rem' },
        [DESKTOP]: { height: '3.875rem' },
      },
    });
  });
});
