import type s from '@/modules/user/features/settings/components/user-profile-settings/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type CardStyles = typeof s;

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';

const loadStyles = (): Promise<CardStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/user-profile-settings/styles'))
        .default
  );

const at = (style: object, media: string): object => Reflect.get(style, media) as object;

describe('user profile settings styles', () => {
  it('draws the card on white with the brand-grey border and a 12 px radius', async () => {
    const { card } = await loadStyles();

    expect(card).toMatchObject({
      backgroundColor: '#FFFFFF',
      border: '1px solid #E1E7EA',
      borderRadius: '0.75rem',
    });
  });

  it('insets the card 8 px from a phone edge with 18 / 17 px content insets', async () => {
    const { card } = await loadStyles();

    expect(card).toMatchObject({
      '--settings-card-inset-start': '1.0625rem',
      '--settings-card-inset-end': '1rem',
      marginInline: '-0.4375rem',
      padding:
        '1.4375rem var(--settings-card-inset-end) 0.9375rem var(--settings-card-inset-start)',
    });
  });

  it('pads the card 32 px on a tablet and 32 / 24 px on desktop, 20 px foot', async () => {
    const { card } = await loadStyles();

    expect(at(card, TABLET)).toEqual({
      '--settings-card-inset-start': '1.9375rem',
      '--settings-card-inset-end': '1.9375rem',
      marginInline: 0,
      paddingTop: '1.1875rem',
    });
    expect(at(card, DESKTOP)).toEqual({
      '--settings-card-inset-end': '1.4375rem',
      paddingTop: '1.0625rem',
      paddingBottom: '1.1875rem',
    });
  });

  it('stops every skeleton animation under prefers-reduced-motion: reduce', async () => {
    const { skeleton } = await loadStyles();

    expect(skeleton['@media (prefers-reduced-motion: reduce)']).toEqual({
      '& *': { animation: 'none' },
    });
  });

  it('sizes the skeleton like the loaded card at each layout', async () => {
    const styles = await loadStyles();

    expect(styles.skeletonMonogram).toMatchObject({ width: '4rem', height: '4rem' });
    expect(at(styles.skeletonMonogram, TABLET)).toEqual({
      width: '6.1875rem',
      height: '6.1875rem',
    });
    expect(styles.skeletonField).toMatchObject({ gap: '0.25rem', marginBottom: '1rem' });
    expect(at(styles.skeletonField, TABLET)).toMatchObject({
      flexDirection: 'row',
      marginBottom: '0.8125rem',
    });
    expect(at(styles.skeletonField, DESKTOP)).toEqual({ marginBottom: '0.75rem' });
    expect(styles.skeletonInput).toEqual({
      height: '3rem',
      [TABLET]: { flex: '1 1 0', minWidth: 0, height: '4.375rem' },
      [DESKTOP]: { height: '4rem' },
    });
    expect(styles.skeletonPolicy).toEqual({ height: '9.375rem', [TABLET]: { height: '7rem' } });
    expect(at(styles.skeletonSave, DESKTOP)).toEqual({ flex: '0 0 16.875rem', height: '3.875rem' });
    expect(at(styles.skeletonClear, DESKTOP)).toEqual({ flex: '0 0 11.25rem', height: '3.875rem' });
  });

  it('pins the failure message colour and the layout gap', async () => {
    const { errorMessage, error } = await loadStyles();

    expect(errorMessage.color).toBe('#1A1C1E');
    expect(error.gap).toBe('1rem');
  });

  it('draws the retry button as the outlined pill with the repository focus ring', async () => {
    const { retryButton } = await loadStyles();

    expect(retryButton['&&']).toMatchObject({
      border: '1px solid #969B9D',
      color: '#1A1C1E',
      borderRadius: '3.5625rem',
      textTransform: 'none',
      letterSpacing: 0,
      width: '100%',
      height: '3.125rem',
      '&:focus-visible': { outline: '2px solid #1A1C1E', outlineOffset: '2px' },
    });
    expect(at(retryButton['&&'], TABLET)).toMatchObject({
      width: 'auto',
      minWidth: '11.25rem',
      height: '4.375rem',
    });
    expect(at(retryButton['&&'], DESKTOP)).toEqual({ height: '3.875rem' });
  });
});
