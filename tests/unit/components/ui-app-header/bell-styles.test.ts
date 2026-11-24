import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type HeaderStyles = (typeof import('@/components/ui-app-header/styles'))['default'];
type BellStyles = (typeof import('@/components/ui-app-header/bell-styles'))['default'];

const FORCED = '@media (forced-colors: active)';

const loadHeader = (): Promise<HeaderStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/styles')).default);

const loadBell = (): Promise<BellStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/bell-styles')).default);

describe('enabled bell styles', () => {
  it.each([
    ['desktop', '48px'],
    ['tablet', '52px'],
  ] as const)(
    'draws the %s bell as a %s white round button with a dark glyph',
    async (layout, size) => {
      const { enabled: all } = await loadBell();
      const enabled = all[layout];

      expect(enabled).toMatchObject({
        width: size,
        height: size,
        borderRadius: '42px',
        backgroundColor: '#FFFFFF',
        color: '#1A1C1E',
        cursor: 'pointer',
      });
      expect(contrast('#1A1C1E', '#FFFFFF')).toBeCloseTo(17.09, 1);
    }
  );

  it.each(['desktop', 'tablet'] as const)(
    'lifts the %s bell above the notice pill drawn behind it',
    async (layout) => {
      const { enabled } = await loadBell();

      expect(enabled[layout]).toMatchObject({ position: 'relative', zIndex: 1 });
    }
  );

  it.each(['desktop', 'tablet'] as const)('fills the %s bell #F4F5F6 on hover', async (layout) => {
    const { enabled } = await loadBell();

    expect(Reflect.get(enabled[layout], '&:hover')).toEqual({
      backgroundColor: '#F4F5F6',
    });
  });

  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'rings the %s bell with 2 px #1A1C1E at offset 2 on keyboard focus only',
    async (layout) => {
      const { enabled: all } = await loadBell();
      const enabled = all[layout];

      expect(Reflect.get(enabled, '&:focus-visible')).toEqual({
        outline: '2px solid #1A1C1E',
        outlineOffset: '2px',
      });
      expect(Reflect.get(enabled, '&:focus:not(:focus-visible)')).toEqual({ outline: 'none' });
    }
  );

  it('makes the mobile bell a 44 px box with a negative margin and a 24 px footprint', async () => {
    const { iconGlyph } = await loadHeader();
    const { enabled } = await loadBell();
    const mobile = enabled.mobile;

    expect(mobile).toMatchObject({
      width: '24px',
      height: '24px',
      minWidth: '2.75rem',
      minHeight: '2.75rem',
      margin: '-0.625rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#1A1C1E',
      backgroundColor: 'transparent',
    });
    expect(iconGlyph.mobile).toEqual({ display: 'block', width: '24px', height: '24px' });
    expect(mobile).not.toHaveProperty('&::before');
    expect(mobile).not.toHaveProperty('&:hover');
  });

  it('leaves the disabled mobile and round buttons as they were', async () => {
    const { iconButton } = await loadHeader();

    expect(iconButton.mobile).toMatchObject({ width: '24px', height: '24px', cursor: 'default' });
    expect(iconButton.mobile).not.toHaveProperty('margin');
    expect(iconButton.desktop).toMatchObject({ backgroundColor: '#E1E7EA', cursor: 'default' });
  });

  it('paints the alert badge #D63333 with a CanvasText border in forced colors', async () => {
    const { badge } = await loadHeader();
    const { alertBadge } = await loadBell();

    expect(alertBadge).toMatchObject({
      zIndex: 1,
      pointerEvents: 'none',
      backgroundColor: '#D63333',
    });
    expect(Reflect.get(alertBadge, FORCED)).toEqual({ border: '1px solid CanvasText' });
    expect(badge.color).toBe('#FFFFFF');
    expect(contrast('#FFFFFF', '#D63333')).toBeCloseTo(4.79, 1);
    expect(contrast('#D63333', '#FFFFFF')).toBeCloseTo(4.79, 1);
    expect(contrast('#D63333', '#FBFBFB')).toBeCloseTo(4.63, 1);
    expect(contrast('#DC3939', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });
});
