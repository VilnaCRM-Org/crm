import loadIsolated from '@tests/unit/utils/isolated-module';
import navigationControlStyle from '@tests/unit/utils/navigation-control-style';

type Styles = (typeof import('@/components/ui-navigation-list/rail-styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-list/rail-styles')).default);

const PILL = {
  ...navigationControlStyle,
  width: '56px',
  height: '40px',
  margin: '7px 8px',
  padding: '8px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#F4F5F6',
    '& svg': {
      color: '#1A1C1E',
    },
  },
};

const TABLET_PILL = { ...PILL, width: '60px', height: '44px' };

describe('navigation rail styles', () => {
  it('pins rail', async () => {
    const styles = await loadStyles();

    expect(styles.rail).toEqual({
      desktop: PILL,
      tablet: { ...TABLET_PILL, margin: '11px 8px' },
      tabletProducts: { ...TABLET_PILL, margin: '12px 8px 11px' },
      tabletCompact: { ...PILL, margin: '13px 8px' },
      action: PILL,
    });
  });

  it('pins railIcon', async () => {
    const styles = await loadStyles();

    expect(styles.railIcon).toEqual({
      desktop: {
        width: '24px',
        height: '24px',
      },
      tablet: {
        width: '28px',
        height: '28px',
      },
      tabletProducts: {
        width: '28px',
        height: '28px',
      },
      tabletCompact: {
        width: '24px',
        height: '24px',
      },
      action: {
        width: '24px',
        height: '24px',
      },
    });
  });

  it('pins railItem', async () => {
    const styles = await loadStyles();

    expect(styles.railItem).toEqual({
      desktop: {
        position: 'relative',
        display: 'flex',
        height: '54px',
      },
      tablet: {
        position: 'relative',
        display: 'flex',
        height: '66px',
      },
      tabletProducts: {
        position: 'relative',
        display: 'flex',
        height: '67px',
      },
      tabletCompact: {
        position: 'relative',
        display: 'flex',
        height: '66px',
      },
      action: {
        position: 'relative',
        display: 'flex',
        height: '54px',
      },
    });
  });

  it('pins tabletShapes', async () => {
    const styles = await loadStyles();

    expect(styles.tabletShapes).toEqual({
      signOut: 'action',
      products: 'tabletProducts',
      integrations: 'tabletCompact',
      webhooks: 'tabletCompact',
      billing: 'tabletCompact',
    });
  });

  it('pins tooltip', async () => {
    const styles = await loadStyles();

    expect(styles.tooltip).toEqual({
      desktop: {
        left: 61,
        top: 4,
      },
      tablet: {
        left: 65,
        top: 8,
      },
      tabletProducts: {
        left: 65,
        top: 9,
      },
      tabletCompact: {
        left: 65,
        top: 10,
      },
      action: {
        left: 65,
        top: 4,
      },
    });
  });

  it('pins tooltipBase', async () => {
    const styles = await loadStyles();

    expect(styles.tooltipBase).toEqual({
      position: 'fixed',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      filter: 'drop-shadow(0 6px 17px rgba(37, 42, 49, 0.07))',
    });
  });

  it('pins tooltipCaret', async () => {
    const styles = await loadStyles();

    expect(styles.tooltipCaret).toEqual({
      flexShrink: 0,
      width: '6px',
      height: '20.785px',
      backgroundColor: '#E1E7EA',
      clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
    });
  });

  it('pins tooltipBody', async () => {
    const styles = await loadStyles();

    expect(styles.tooltipBody).toEqual({
      boxSizing: 'border-box',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      boxShadow: 'inset 0 0 0 1px #E1E7EA',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '16px',
      lineHeight: '18px',
      whiteSpace: 'nowrap',
      color: '#191B1E',
    });
  });

  it.each(['desktop', 'tablet', 'tabletProducts', 'tabletCompact', 'action'] as const)(
    'keeps a visited %s rail item in the label colour, ahead of hover and the current item',
    async (shape) => {
      const pill = (await loadStyles()).rail[shape];
      const keys = Object.keys(pill);

      expect(pill).toHaveProperty(['&:visited'], { color: '#404142' });
      expect(keys.indexOf('&:visited')).toBeGreaterThan(-1);
      expect(keys.indexOf('&:visited')).toBeLessThan(keys.indexOf('&:hover'));
      expect(keys.indexOf('&:hover')).toBeLessThan(keys.indexOf('&[aria-current="page"]'));
    }
  );
});
