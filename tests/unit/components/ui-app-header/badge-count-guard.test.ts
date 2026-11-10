import badgeCountGuard from '@/components/ui-app-header/badge-count-guard';

describe('badgeCountGuard', () => {
  it.each([1, 2, 8, 21, 1000])('shows the whole count %i', (count) => {
    expect(badgeCountGuard.shows(count)).toBe(true);
  });

  it.each([
    0,
    -1,
    0.5,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    null,
    undefined,
  ])('shows nothing for %s', (count) => {
    expect(badgeCountGuard.shows(count)).toBe(false);
  });
});
