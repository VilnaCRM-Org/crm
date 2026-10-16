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
      success: { color: '#38B386' },
      error: { color: '#DC3939' },
    });
    expect(styles.toast.color).toBe('#1A1C1E');
    expect(styles.close.color).toBe('#1A1C1E');
    expect(styles.action.color).toBe('#1A1C1E');
  });

  it('fixes the stack bottom-right from sm and spans the bottom below it', async () => {
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
    });
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
