import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type ToastStyles = (typeof import('@/components/ui-toast/styles'))['default'];

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

    expect(stack).toMatchObject({
      position: 'fixed',
      left: '0.9375rem',
      right: '0.9375rem',
      bottom: '0.9375rem',
      '@media (min-width:480px)': {
        left: 'auto',
        right: '1.5rem',
        bottom: '1.5rem',
        width: '24.8125rem',
      },
      '@media (min-width:1025px)': { right: '0.75rem' },
    });
  });

  it('puts an action on its own row under the message so the message keeps its width', async () => {
    const { toast, icon, message, action, close } = await loadStyles();

    expect(toast).toMatchObject({
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      alignItems: 'start',
      rowGap: '0.25rem',
    });
    expect(icon).toMatchObject({ gridColumn: 1, gridRow: 1 });
    expect(message).toMatchObject({ gridColumn: 2, gridRow: 1, minWidth: 0 });
    expect(action).toMatchObject({ gridColumn: 2, gridRow: 2, justifySelf: 'start' });
    expect(close).toMatchObject({ gridColumn: 3, gridRow: 1 });
  });

  it('sets the message line to the icon height so a one-line toast stays centred', async () => {
    const { message, icon } = await loadStyles();

    expect(message.lineHeight).toBe('1.25rem');
    expect(icon.fontSize).toBe('1.25rem');
    expect(message['@media (min-width:480px)']).toEqual({ lineHeight: '1.5rem' });
    expect(icon['@media (min-width:480px)']).toEqual({ fontSize: '1.5rem' });
  });

  it('gives the buttons a 44 CSS px minimum height below sm and less from sm', async () => {
    const { action, close } = await loadStyles();

    expect(close.minHeight).toBe('2.75rem');
    expect(action.minHeight).toBe('2.75rem');
    expect(close['@media (min-width:480px)']).toMatchObject({ minHeight: '1.5rem' });
    expect(action['@media (min-width:480px)']).toMatchObject({ minHeight: '1.5rem' });
  });

  it('declares no transition and no keyframes', async () => {
    const styles = await loadStyles();
    const serialized = JSON.stringify(styles);

    expect(serialized).not.toMatch(/transition|animation|keyframes/i);
  });
});
