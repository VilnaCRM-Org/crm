import loadIsolated from '@tests/unit/utils/isolated-module';

type SidebarStyles = (typeof import('@/components/ui-sidebar/styles'))['default'];
type GroupStyles = (typeof import('@/components/ui-navigation-list/group-styles'))['default'];
type RailStyles = (typeof import('@/components/ui-navigation-list/rail-styles'))['default'];

const WHITE = '#FFFFFF';
const NON_TEXT_MINIMUM = 3;

const channel = (hex: string, offset: number): number => {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);

const contrast = (foreground: string, background: string): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

const colourOf = (style: unknown, path: readonly string[]): string => {
  const value = path.reduce<unknown>(
    (node, key) => (node as Record<string, unknown> | undefined)?.[key],
    style
  );
  expect(typeof value).toBe('string');
  return String(value);
};

describe('WCAG 1.4.11 non-text contrast of the icon-only shell controls (issue #362)', () => {
  it('measures the contrast formula against known pairs', () => {
    expect(contrast('#000000', WHITE)).toBeCloseTo(21, 5);
    expect(contrast('#969B9D', WHITE)).toBeLessThan(NON_TEXT_MINIMUM);
    expect(contrast('#57595B', WHITE)).toBeGreaterThan(7);
  });

  it.each([
    ['desktop', 'expanded'],
    ['desktop', 'rail'],
    ['tablet', 'expanded'],
    ['tablet', 'rail'],
  ] as const)(
    'draws the %s %s collapse handle chevron at 3:1 or more on its white face',
    async (layout, state) => {
      const styles = await loadIsolated<SidebarStyles>(
        async () => (await import('@/components/ui-sidebar/styles')).default
      );

      expect(colourOf(styles.handle[layout][state], ['backgroundColor'])).toBe(WHITE);
      expect(
        contrast(colourOf(styles.handle[layout][state], ['color']), WHITE)
      ).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
    }
  );

  it('draws the Settings disclosure chevron at 3:1 or more on white', async () => {
    const styles = await loadIsolated<GroupStyles>(
      async () => (await import('@/components/ui-navigation-list/group-styles')).default
    );

    expect(contrast(colourOf(styles.toggleBase, ['color']), WHITE)).toBeGreaterThanOrEqual(
      NON_TEXT_MINIMUM
    );
  });

  it.each(['desktop', 'tablet', 'tabletProducts', 'tabletCompact', 'action'] as const)(
    'draws the %s rail shape icons at 3:1 or more on white',
    async (shape) => {
      const styles = await loadIsolated<RailStyles>(
        async () => (await import('@/components/ui-navigation-list/rail-styles')).default
      );

      expect(
        contrast(colourOf(styles.rail[shape], ['& svg', 'color']), WHITE)
      ).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
    }
  );
});
