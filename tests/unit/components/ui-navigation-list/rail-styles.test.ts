import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-navigation-list/rail-styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-list/rail-styles')).default);

describe('navigation rail styles', () => {
  it('pins rail', async () => {
    const styles = await loadStyles();

    expect(styles.rail).toEqual({
      desktop: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '56px',
        margin: '7px 8px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          '& svg': {
            color: '#1A1C1E',
          },
        },
        '&[aria-current="page"]': {
          backgroundColor: 'rgba(30, 174, 255, 0.1)',
          color: '#0399ED',
          '& svg': {
            color: '#0399ED',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        height: '40px',
        padding: '8px 16px',
        borderRadius: '8px',
      },
      tablet: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '60px',
        margin: '11px 8px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          '& svg': {
            color: '#1A1C1E',
          },
        },
        '&[aria-current="page"]': {
          backgroundColor: 'rgba(30, 174, 255, 0.1)',
          color: '#0399ED',
          '& svg': {
            color: '#0399ED',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        height: '44px',
        padding: '8px 16px',
        borderRadius: '8px',
      },
      tabletProducts: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '60px',
        margin: '12px 8px 11px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          '& svg': {
            color: '#1A1C1E',
          },
        },
        '&[aria-current="page"]': {
          backgroundColor: 'rgba(30, 174, 255, 0.1)',
          color: '#0399ED',
          '& svg': {
            color: '#0399ED',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        height: '44px',
        padding: '8px 16px',
        borderRadius: '8px',
      },
      tabletCompact: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '56px',
        margin: '13px 8px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          '& svg': {
            color: '#1A1C1E',
          },
        },
        '&[aria-current="page"]': {
          backgroundColor: 'rgba(30, 174, 255, 0.1)',
          color: '#0399ED',
          '& svg': {
            color: '#0399ED',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        height: '40px',
        padding: '8px 16px',
        borderRadius: '8px',
      },
      action: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '56px',
        margin: '7px 8px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          '& svg': {
            color: '#1A1C1E',
          },
        },
        '&[aria-current="page"]': {
          backgroundColor: 'rgba(30, 174, 255, 0.1)',
          color: '#0399ED',
          '& svg': {
            color: '#0399ED',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        height: '40px',
        padding: '8px 16px',
        borderRadius: '8px',
      },
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
        left: '61px',
        top: '4px',
      },
      tablet: {
        left: '65px',
        top: '8px',
      },
      tabletProducts: {
        left: '65px',
        top: '9px',
      },
      tabletCompact: {
        left: '65px',
        top: '10px',
      },
      action: {
        left: '65px',
        top: '4px',
      },
    });
  });

  it('pins tooltipBase', async () => {
    const styles = await loadStyles();

    expect(styles.tooltipBase).toEqual({
      position: 'absolute',
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
});
