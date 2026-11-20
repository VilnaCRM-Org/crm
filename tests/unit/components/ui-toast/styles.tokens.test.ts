import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type ToastStyles = (typeof import('@/components/ui-toast/styles'))['default'];

const SM = '@media (min-width:480px)';
const DESKTOP = '@media (min-width:1025px)';
const REDUCED = '@media (prefers-reduced-motion: reduce)';
const FORCED = '@media (forced-colors: active)';
const SHADOW = '0 8px 27px rgba(49, 59, 67, 0.14)';

const loadStyles = (): Promise<ToastStyles> =>
  loadIsolated(async () => (await import('@/components/ui-toast/styles')).default);

describe('toast styles', () => {
  it('takes the surfaces and text from the palette tokens', async () => {
    const { tones, toast } = await loadStyles();

    expect(tones.success.backgroundColor).toBe('#E8F4EF');
    expect(tones.error.backgroundColor).toBe('#FDECEC');
    expect(toast.color).toBe('#1A1C1E');
  });

  it('draws a 1 px tone edge, a 4 px accent and the popover shadow on each tone', async () => {
    const { tones, toast } = await loadStyles();

    expect(toast.border).toBe('1px solid');
    expect(tones.success).toMatchObject({
      borderColor: '#2E7D32',
      boxShadow: `inset 4px 0 0 0 #2E7D32, ${SHADOW}`,
    });
    expect(tones.error).toMatchObject({
      borderColor: '#DC3939',
      boxShadow: `inset 4px 0 0 0 #DC3939, ${SHADOW}`,
    });
  });

  it.each([
    ['success', '#2E7D32', '#FBFBFB', 4.95],
    ['error', '#DC3939', '#FBFBFB', 4.33],
    ['success', '#2E7D32', '#F4F5F6', 4.7],
    ['error', '#DC3939', '#F4F5F6', 4.1],
  ] as const)('keeps the %s edge %s at %s:1 on %s', async (tone, edge, page, ratio) => {
    const { tones } = await loadStyles();

    expect(tones[tone].borderColor).toBe(edge);
    expect(contrast(tones[tone].borderColor, page)).toBeCloseTo(ratio, 1);
  });

  it.each([
    ['success', '#E8F4EF', 15.15, 4.55],
    ['error', '#FDECEC', 14.96, 3.92],
  ] as const)('keeps the text and icon readable on the %s fill', async (tone, fill, text, icon) => {
    const { tones, toast } = await loadStyles();

    expect(tones[tone].backgroundColor).toBe(fill);
    expect(contrast(toast.color, fill)).toBeCloseTo(text, 1);
    expect(contrast(tone === 'success' ? '#2E7D32' : '#DC3939', fill)).toBeCloseTo(icon, 1);
  });

  it('keeps main geometry and takes one pixel off each padding side for the new edge', async () => {
    const { toast } = await loadStyles();

    expect(toast).toMatchObject({
      padding: '0.9375rem',
      borderRadius: '0.75rem',
      color: '#1A1C1E',
    });
    expect(toast[SM]).toMatchObject({ padding: '1.125rem 1.0625rem 1.125rem 1.1875rem' });
  });

  it('slides in 16 px over 180 ms on mount only, from the bottom then the end', async () => {
    const { toast } = await loadStyles();
    const below = String(toast.animation);
    const fromSm = JSON.stringify(Object.entries(toast).find(([key]) => key === SM)?.[1]);

    expect(below).toContain('translateY(16px)');
    expect(below).toContain('opacity: 0');
    expect(below).toContain('180ms cubic-bezier(0.2, 0, 0, 1)');
    expect(fromSm).toContain('translateX(16px)');
    expect(fromSm).toContain('opacity: 0');
    expect(fromSm).toContain('180ms cubic-bezier(0.2, 0, 0, 1)');
    expect(JSON.stringify(toast)).not.toMatch(/transition|iterationCount|infinite/);
  });

  it('plays no animation, so no transform applies at any frame, under reduced motion', async () => {
    const { toast } = await loadStyles();

    expect(toast[REDUCED]).toEqual({ animation: 'none' });
    expect(Object.keys(toast).indexOf(REDUCED)).toBeGreaterThan(Object.keys(toast).indexOf(SM));
  });

  it('shows a system-colour edge and drops the accent and shadow in forced colors', async () => {
    const { toast } = await loadStyles();

    expect(toast[FORCED]).toEqual({ borderColor: 'CanvasText', boxShadow: 'none' });
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
      maxHeight: 'calc(50dvh - 0.9375rem)',
      overflowY: 'auto',
      [SM]: expect.objectContaining({ width: '24.8125rem', maxHeight: 'calc(50dvh - 1.5rem)' }),
      [DESKTOP]: { right: '0.75rem' },
    });
  });

  it('anchors the stack 1.5 rem from the corner from sm, and no wider than its width', async () => {
    const { stack } = await loadStyles();

    expect(stack[SM]).toEqual({
      maxHeight: 'calc(50dvh - 1.5rem)',
      width: '24.8125rem',
      bottom: '1.5rem',
      right: '1.5rem',
      left: 'auto',
    });
  });

  it('draws no icon, message, action or close style of its own any more', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual(['stack', 'toast', 'tones']);
  });
});
