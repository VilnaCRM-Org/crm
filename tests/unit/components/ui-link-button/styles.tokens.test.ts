import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type LinkButtonStyles = (typeof import('@/components/ui-link-button/styles'))['default'];

const loadStyles = (): Promise<LinkButtonStyles> =>
  loadIsolated(async () => (await import('@/components/ui-link-button/styles')).default);

describe('link button styles', () => {
  it('underlines the link token, darkens it on hover and rings it on keyboard focus', async () => {
    const { button } = await loadStyles();

    expect(button).toEqual({
      padding: 0,
      border: 0,
      background: 'none',
      font: 'inherit',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      textAlign: 'left',
      color: '#0074B5',
      textDecoration: 'underline',
      textUnderlineOffset: '0.15em',
      cursor: 'pointer',
      '&:hover': { color: '#00588A' },
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { color: '#0074B5' },
      '&:focus-visible': { outline: '2px solid #0074B5', outlineOffset: '2px' },
    });
  });

  it('keeps the link text at AA contrast on white', async () => {
    const { button } = await loadStyles();

    expect(contrast(button.color, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
