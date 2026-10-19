import type s from '@/modules/user/features/settings/components/user-profile-settings/styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type CardStyles = typeof s;

const loadStyles = (): Promise<CardStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/user-profile-settings/styles'))
        .default
  );

describe('user profile settings styles', () => {
  it('draws the card on white with the brand-grey border and a 12 px radius', async () => {
    const { card } = await loadStyles();

    expect(card).toMatchObject({
      backgroundColor: '#FFFFFF',
      border: '1px solid #E1E7EA',
      borderRadius: '0.75rem',
    });
  });

  it('stops every skeleton animation under prefers-reduced-motion: reduce', async () => {
    const { skeleton } = await loadStyles();

    expect(skeleton['@media (prefers-reduced-motion: reduce)']).toEqual({
      '& *': { animation: 'none' },
    });
  });

  it('pins the failure message colour and the layout gaps', async () => {
    const { errorMessage, error, skeleton } = await loadStyles();

    expect(errorMessage.color).toBe('#1A1C1E');
    expect(error.gap).toBe('1rem');
    expect(skeleton.gap).toBe('1.5rem');
  });

  it('draws the repository focus ring on the retry button', async () => {
    const { retryButton } = await loadStyles();

    expect(retryButton).toEqual({
      '&:focus-visible': { outline: '2px solid #1A1C1E', outlineOffset: '2px' },
    });
  });
});
