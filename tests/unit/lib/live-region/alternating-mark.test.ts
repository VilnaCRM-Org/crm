import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('ALTERNATING_MARK', () => {
  it('is the single zero-width space that makes a repeated status text differ', () => {
    expect(ALTERNATING_MARK).toBe('\u200b');
    expect(ALTERNATING_MARK.codePointAt(0)).toBe(0x200b);
    expect(ALTERNATING_MARK).toHaveLength(1);
    expect(ALTERNATING_MARK.trim()).toBe(ALTERNATING_MARK);
    expect(`Збережено${ALTERNATING_MARK}`).not.toBe('Збережено');
  });

  it('is evaluated as the zero-width space when the module loads inside the test', async () => {
    const mark = await loadIsolated(
      async () => (await import('@/lib/live-region/alternating-mark')).default
    );

    expect(mark).toBe('\u200b');
  });
});
