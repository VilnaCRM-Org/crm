import loadIsolated from '@tests/unit/utils/isolated-module';

type EdgeButtonStyles = (typeof import('@/components/ui-app-header/edge-button-styles'))['default'];

const loadStyles = (): Promise<EdgeButtonStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/edge-button-styles')).default);

const NARROWEST = '@media (max-width:374px)';

describe('edge button styles', () => {
  it('draws a transparent 44 px target around the glyph with the standalone ring', async () => {
    const { target } = await loadStyles();

    expect(target).toEqual({
      '&:focus-visible': { outline: '2px solid #1A1C1E', outlineOffset: '2px' },
      '&:focus:not(:focus-visible)': { outline: 'none' },
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
      [NARROWEST]: {
        margin: '-10px -8px -10px -12px',
        padding: '10px 8px 10px 12px',
      },
    });
  });

  it('keeps the glyph in place at 320 px by moving the trimmed edge to the left', async () => {
    const { target } = await loadStyles();
    const narrow = target[NARROWEST];
    const leftMargin = parseFloat(narrow.margin.split(' ')[3] ?? '');
    const leftPadding = parseFloat(narrow.padding.split(' ')[3] ?? '');
    const rightMargin = parseFloat(narrow.margin.split(' ')[1] ?? '');
    const rightPadding = parseFloat(narrow.padding.split(' ')[1] ?? '');

    expect(narrow).not.toHaveProperty('width');
    expect(leftMargin + leftPadding).toBe(0);
    expect(rightMargin + rightPadding).toBe(0);
    expect(leftPadding + 24 + rightPadding).toBe(44);
  });
});
