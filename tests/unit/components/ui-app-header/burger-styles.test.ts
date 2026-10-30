import loadIsolated from '@tests/unit/utils/isolated-module';

type BurgerStyles = (typeof import('@/components/ui-app-header/burger-styles'))['default'];

const loadStyles = (): Promise<BurgerStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/burger-styles')).default);

const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

describe('burger styles', () => {
  it('draws the 44 px transparent target around the #57595B glyph', async () => {
    const { burger, glyph } = await loadStyles();

    expect(burger).toMatchObject({
      display: 'block',
      flexShrink: 0,
      boxSizing: 'border-box',
      width: '44px',
      height: '44px',
      margin: '-10px',
      padding: '10px',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: '#57595B',
    });
    expect(burger['&:focus-visible']).toEqual(RING);
    expect(burger['&:focus:not(:focus-visible)']).toEqual({ outline: 'none' });
    expect(glyph).toEqual({ display: 'block', width: '24px', height: '24px' });
  });

  it('keeps the 44 px target and a whole ring at 320 px, the trimmed edge moved left', async () => {
    const { burger } = await loadStyles();

    expect(burger.width).toBe('44px');
    expect(burger['@media (max-width:374px)']).toEqual({
      '&:focus-visible': { outlineOffset: '-2px' },
      margin: '-10px -8px -10px -12px',
      padding: '10px 8px 10px 12px',
    });
  });
});
