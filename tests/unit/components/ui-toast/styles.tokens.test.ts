import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type ToastStyles = (typeof import('@/components/ui-toast/styles'))['default'];

const SM = '@media (min-width:480px)';
const DESKTOP = '@media (min-width:1025px)';
const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };
const CONTROL_FROM_SM = { margin: 0, minWidth: '1.5rem', minHeight: '1.5rem' };
const CONTROL = {
  margin: '-0.75rem',
  minWidth: '2.75rem',
  minHeight: '2.75rem',
  padding: 0,
  color: '#1A1C1E',
  '&:hover, &:focus-visible': { backgroundColor: 'transparent' },
  '&:focus-visible': RING,
  '@media (prefers-reduced-motion: reduce)': { '& .MuiTouchRipple-root': { display: 'none' } },
  [SM]: CONTROL_FROM_SM,
};

const loadStyles = (): Promise<ToastStyles> =>
  loadIsolated(async () => (await import('@/components/ui-toast/styles')).default);

describe('toast styles', () => {
  it('takes the surfaces, icons and text from the palette tokens', async () => {
    const styles = await loadStyles();

    expect(styles.tones).toEqual({
      success: { backgroundColor: '#E8F4EF' },
      error: { backgroundColor: '#FDECEC' },
    });
    expect(styles.iconTones).toEqual({
      success: { color: '#2E7D32' },
      error: { color: '#DC3939' },
    });
    expect(styles.toast.color).toBe('#1A1C1E');
    expect(styles.close.color).toBe('#1A1C1E');
    expect(styles.action.color).toBe('#1A1C1E');
  });

  it('keeps every toast text at 4.5:1 and every icon at 3:1 on its own surface', async () => {
    const { tones, iconTones, toast, close, action } = await loadStyles();

    for (const tone of ['success', 'error'] as const) {
      const surface = tones[tone].backgroundColor;
      expect(contrast(toast.color, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(close.color, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(action.color, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(iconTones[tone].color, surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it('draws a system-colour border in forced-colors mode and none otherwise', async () => {
    const { toast } = await loadStyles();

    expect(toast['@media (forced-colors: active)']).toEqual({ border: '1px solid CanvasText' });
    expect(toast).not.toHaveProperty('border');
  });

  it('fixes the stack bottom-right from sm, 12 px in on desktop, full width below sm', async () => {
    const { stack } = await loadStyles();

    expect(stack).toEqual({
      position: 'fixed',
      left: '0.9375rem',
      right: '0.9375rem',
      bottom: '0.9375rem',
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      [SM]: { left: 'auto', right: '1.5rem', bottom: '1.5rem', width: '24.8125rem' },
      [DESKTOP]: { right: '0.75rem' },
    });
  });

  it('lays the toast out as a three-column grid in Golos on a 12 px radius', async () => {
    const { toast } = await loadStyles();

    expect(toast).toEqual({
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      alignItems: 'start',
      columnGap: '0.375rem',
      rowGap: '0.25rem',
      padding: '1rem',
      borderRadius: '0.75rem',
      fontFamily: 'Golos',
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 'normal',
      color: '#1A1C1E',
      [SM]: {
        columnGap: '0.5rem',
        padding: '1.1875rem 1.125rem 1.1875rem 1.25rem',
        fontSize: '1rem',
      },
      '@media (forced-colors: active)': { border: '1px solid CanvasText' },
    });
  });

  it('puts an action on its own row under the message so the message keeps its width', async () => {
    const { icon, message, action, close } = await loadStyles();

    expect(icon).toEqual({
      gridColumn: 1,
      gridRow: 1,
      display: 'inline-flex',
      fontSize: '1.25rem',
      [SM]: { fontSize: '1.5rem' },
    });
    expect(message).toEqual({
      gridColumn: 2,
      gridRow: 1,
      minWidth: 0,
      lineHeight: '1.25rem',
      overflowWrap: 'anywhere',
      [SM]: { lineHeight: '1.5rem' },
    });
    expect(action).toMatchObject({ gridColumn: 2, gridRow: 2, justifySelf: 'start' });
    expect(close).toMatchObject({ gridColumn: 3, gridRow: 1 });
  });

  it('draws the action as an underlined inline text button with the shared control', async () => {
    const { action } = await loadStyles();

    expect(action).toEqual({
      ...CONTROL,
      margin: '-0.75rem 0',
      minWidth: 0,
      border: 0,
      background: 'none',
      cursor: 'pointer',
      font: 'inherit',
      textDecoration: 'underline',
      gridColumn: 2,
      gridRow: 2,
      justifySelf: 'start',
      [SM]: { margin: 0, minHeight: '1.5rem' },
    });
  });

  it('draws the close button as the shared control bleeding into the toast padding', async () => {
    const { close } = await loadStyles();

    expect(close).toEqual({
      ...CONTROL,
      gridColumn: 3,
      gridRow: 1,
      fontSize: '1.25rem',
      [SM]: { ...CONTROL_FROM_SM, fontSize: '1.5rem' },
    });
  });

  it('rings both controls in #1A1C1E and never paints a hover surface on them', async () => {
    const { action, close } = await loadStyles();

    expect(close['&:focus-visible']).toEqual(RING);
    expect(action['&:focus-visible']).toEqual(RING);
    expect(close['&:hover, &:focus-visible']).toEqual({ backgroundColor: 'transparent' });
    expect(action['&:hover, &:focus-visible']).toEqual({ backgroundColor: 'transparent' });
  });

  it('hides the MUI ripple on both controls when the user asks for reduced motion', async () => {
    const { action, close } = await loadStyles();
    const reduced = { '& .MuiTouchRipple-root': { display: 'none' } };

    expect(close['@media (prefers-reduced-motion: reduce)']).toEqual(reduced);
    expect(action['@media (prefers-reduced-motion: reduce)']).toEqual(reduced);
  });

  it('gives the buttons a 44 CSS px minimum height below sm and less from sm', async () => {
    const { action, close } = await loadStyles();

    expect(close.minHeight).toBe('2.75rem');
    expect(action.minHeight).toBe('2.75rem');
    expect(close[SM]).toEqual({
      margin: 0,
      minWidth: '1.5rem',
      minHeight: '1.5rem',
      fontSize: '1.5rem',
    });
    expect(action[SM]).toEqual({ margin: 0, minHeight: '1.5rem' });
  });

  it('declares no transition and no keyframes', async () => {
    const styles = await loadStyles();
    const serialized = JSON.stringify(styles);

    expect(serialized).not.toMatch(/transition|animation|keyframes/i);
  });
});
