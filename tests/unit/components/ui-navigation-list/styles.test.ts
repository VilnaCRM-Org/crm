import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-navigation-list/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-list/styles')).default);

describe('navigation list styles', () => {
  it('pins list', async () => {
    const styles = await loadStyles();

    expect(styles.list).toEqual({
      expanded: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        margin: '0 -1px',
        padding: 0,
        listStyle: 'none',
        overflowY: 'auto',
      },
      rail: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        margin: '0 -1px',
        padding: 0,
        listStyle: 'none',
        overflow: 'visible',
      },
    });
  });

  it('pins item', async () => {
    const styles = await loadStyles();

    expect(styles.item).toEqual({
      position: 'relative',
      flexShrink: 0,
      margin: 0,
      padding: 0,
      listStyle: 'none',
    });
  });

  it('pins row', async () => {
    const styles = await loadStyles();

    expect(styles.row).toEqual({
      desktop: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          color: '#1A1C1E',
          '& svg': {
            color: '#404142',
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
        padding: '0 0 0 24px',
        gap: '8px',
        height: '54px',
        fontSize: '16px',
        lineHeight: '18px',
      },
      tablet: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          color: '#1A1C1E',
          '& svg': {
            color: '#404142',
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
        padding: '0 0 0 24px',
        gap: '8px',
        height: '66px',
        fontSize: '18px',
        lineHeight: '22px',
      },
    });
  });

  it('pins rowById', async () => {
    const styles = await loadStyles();

    expect(styles.rowById).toEqual({
      desktop: {},
      tablet: {
        products: {
          height: '67px',
          paddingTop: '1px',
        },
        settings: {
          paddingTop: '6px',
        },
      },
    });
  });

  it('pins action', async () => {
    const styles = await loadStyles();

    expect(styles.action).toEqual({
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      width: '100%',
      margin: 0,
      border: 0,
      background: 'transparent',
      textAlign: 'left',
      textDecoration: 'none',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      color: '#404142',
      '& svg': {
        flexShrink: 0,
        fill: 'none',
        color: '#969B9D',
      },
      '&:hover': {
        backgroundColor: '#F4F5F6',
        color: '#1A1C1E',
        '& svg': {
          color: '#404142',
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
      padding: '0 0 0 24px',
      gap: '8px',
      height: '54px',
      fontSize: '16px',
      lineHeight: '18px',
    });
  });

  it('pins icon', async () => {
    const styles = await loadStyles();

    expect(styles.icon).toEqual({
      desktop: {
        width: '24px',
        height: '24px',
      },
      tablet: {
        width: '28px',
        height: '28px',
      },
      action: {
        width: '24px',
        height: '24px',
      },
    });
  });

  it('pins sub', async () => {
    const styles = await loadStyles();

    expect(styles.sub).toEqual({
      desktop: {
        display: 'block',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        whiteSpace: 'nowrap',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          color: '#1A1C1E',
          '& svg': {
            color: '#404142',
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
        lineHeight: '18px',
        height: '42px',
        padding: '9px 0 0 56px',
        fontSize: '16px',
      },
      tablet: {
        display: 'block',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        whiteSpace: 'nowrap',
        color: '#404142',
        '& svg': {
          flexShrink: 0,
          fill: 'none',
          color: '#969B9D',
        },
        '&:hover': {
          backgroundColor: '#F4F5F6',
          color: '#1A1C1E',
          '& svg': {
            color: '#404142',
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
        lineHeight: '18px',
        height: '46px',
        padding: '8px 0 0 60px',
        fontSize: '18px',
      },
    });
  });

  it('pins signOut', async () => {
    const styles = await loadStyles();

    expect(styles.signOut).toEqual({
      position: 'sticky',
      bottom: 0,
      flexShrink: 0,
      marginTop: 'auto',
      padding: 0,
      listStyle: 'none',
      backgroundColor: '#FFFFFF',
    });
  });

  it('pins divider', async () => {
    const styles = await loadStyles();

    expect(styles.divider).toEqual({
      expanded: {
        height: '1px',
        margin: '0 0 21px',
        border: 0,
        width: '100%',
        backgroundColor: '#E1E7EA',
      },
      desktopRail: {
        height: '1px',
        margin: '0 0 21px',
        border: 0,
        width: '74px',
        backgroundColor: '#E1E7EA',
      },
      tabletRail: {
        height: '1px',
        margin: '0 0 21px',
        border: 0,
        width: '96px',
        backgroundColor: '#E1E7EA',
      },
    });
  });

  it('pins hidden', async () => {
    const styles = await loadStyles();

    expect(styles.hidden).toEqual({
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: '1px',
    });
  });
});
