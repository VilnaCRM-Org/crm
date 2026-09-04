/**
 * Breakpoint widths are a design contract, so the numbers themselves are the test case rather
 * than generated data. The module is imported inside each test because both object literals are
 * evaluated at module load: a static import would evaluate them before any assertion could run.
 */
const CUSTOM_BREAKPOINT_VALUES = { xs: 320, sm: 480, md: 768, lg: 1024, xl: 1440 };

describe('ui-breakpoints theme', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('pins every custom breakpoint width, overriding the Material UI defaults', async () => {
    const { default: breakpointsTheme } = await import('@/components/ui-breakpoints');

    expect(breakpointsTheme.breakpoints.values).toEqual(CUSTOM_BREAKPOINT_VALUES);
  });

  it('builds min-width media queries from the custom widths', async () => {
    const { default: breakpointsTheme } = await import('@/components/ui-breakpoints');

    expect(breakpointsTheme.breakpoints.up('xs')).toBe('@media (min-width:320px)');
    expect(breakpointsTheme.breakpoints.up('sm')).toBe('@media (min-width:480px)');
    expect(breakpointsTheme.breakpoints.up('md')).toBe('@media (min-width:768px)');
    expect(breakpointsTheme.breakpoints.up('lg')).toBe('@media (min-width:1024px)');
    expect(breakpointsTheme.breakpoints.up('xl')).toBe('@media (min-width:1440px)');
  });

  it('keeps the breakpoint keys in ascending width order', async () => {
    const { default: breakpointsTheme } = await import('@/components/ui-breakpoints');

    expect(breakpointsTheme.breakpoints.keys).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  it('pins the viewport-height breakpoints', async () => {
    const { heightBreakpoints } = await import('@/components/ui-breakpoints');

    expect(heightBreakpoints).toEqual({ compact: 550, medium: 700 });
  });
});
