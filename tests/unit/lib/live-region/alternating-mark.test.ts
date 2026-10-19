import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

describe('ALTERNATING_MARK', () => {
  it('is the single zero-width space that makes a repeated status text differ', () => {
    expect(ALTERNATING_MARK).toBe('​');
    expect(ALTERNATING_MARK).toHaveLength(1);
    expect(ALTERNATING_MARK.trim()).toBe(ALTERNATING_MARK);
    expect(`Збережено${ALTERNATING_MARK}`).not.toBe('Збережено');
  });
});
