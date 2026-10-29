import loadIsolated from '@tests/unit/utils/isolated-module';
import navigationControlStyle from '@tests/unit/utils/navigation-control-style';

type Styles = (typeof import('@/components/ui-navigation-list/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-list/styles')).default);

const ROW = { ...navigationControlStyle, padding: '2px 0 2px 24px', gap: '8px' };

const SUB = { ...navigationControlStyle, display: 'block', fontWeight: 400 };

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
        scrollPaddingBottom: '76px',
        '&:focus:not(:focus-visible)': { outline: 'none' },
      },
      rail: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        margin: '0 -1px',
        padding: 0,
        listStyle: 'none',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollPaddingBottom: '76px',
        '&:focus:not(:focus-visible)': { outline: 'none' },
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      },
      drawer: {
        margin: '8px 0 0',
        padding: 0,
        listStyle: 'none',
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

  it('pins itemDrawer', async () => {
    const styles = await loadStyles();

    expect(styles.itemDrawer).toEqual({
      position: 'relative',
      flexShrink: 0,
      width: '233px',
      margin: 0,
      padding: 0,
      listStyle: 'none',
    });
  });

  it('pins row', async () => {
    const styles = await loadStyles();

    expect(styles.row).toEqual({
      desktop: { ...ROW, minHeight: '54px', fontSize: '16px', lineHeight: '1.125' },
      tablet: { ...ROW, minHeight: '66px', fontSize: '18px', lineHeight: 'calc(22 / 18)' },
      drawer: { ...ROW, minHeight: '60px', fontSize: '16px', lineHeight: '1.125' },
    });
  });

  it('pins rowById', async () => {
    const styles = await loadStyles();

    expect(styles.rowById).toEqual({
      desktop: {},
      tablet: {
        products: {
          minHeight: '67px',
          paddingTop: '3px',
        },
        settings: {
          paddingTop: '8px',
        },
      },
      drawer: {},
    });
  });

  it('pins rowOpen', async () => {
    const styles = await loadStyles();

    expect(styles.rowOpen).toEqual({
      desktop: {},
      tablet: {},
      drawer: {
        minHeight: '48px',
      },
    });
  });

  it('pins action', async () => {
    const styles = await loadStyles();

    expect(styles.action).toEqual({
      ...ROW,
      minHeight: '54px',
      fontSize: '16px',
      lineHeight: '1.125',
    });
  });

  it('pins actionDrawer', async () => {
    const styles = await loadStyles();

    expect(styles.actionDrawer).toEqual({
      ...ROW,
      padding: '2px 0 3px 24px',
      minHeight: '54px',
      borderTop: '1px solid #E1E7EA',
      fontSize: '16px',
      lineHeight: '1.125',
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
      drawer: {
        width: '24px',
        height: '24px',
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
        ...SUB,
        lineHeight: '1.125',
        minHeight: '42px',
        padding: '9px 0 2px 56px',
        fontSize: '16px',
      },
      tablet: {
        ...SUB,
        lineHeight: '1',
        minHeight: '46px',
        padding: '8px 0 4px 60px',
        fontSize: '18px',
      },
      drawer: {
        ...SUB,
        lineHeight: '1.125',
        minHeight: '42px',
        padding: '12px 0 2px 56px',
        fontSize: '16px',
      },
    });
  });

  it('pins groupLabel to the room between the label and the chevron box', async () => {
    const styles = await loadStyles();
    const wrapping = { minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' };

    expect(styles.groupLabel).toEqual({
      desktop: { ...wrapping, maxWidth: '136px' },
      tablet: { ...wrapping, maxWidth: '131px' },
      drawer: { ...wrapping, maxWidth: '129px' },
    });
  });

  it('pins signOutDrawer', async () => {
    const styles = await loadStyles();

    expect(styles.signOutDrawer).toEqual({
      margin: 0,
      padding: 0,
      listStyle: 'none',
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

  it.each([
    ['desktop row', (styles: Styles): object => styles.row.desktop],
    ['tablet row', (styles: Styles): object => styles.row.tablet],
    ['drawer row', (styles: Styles): object => styles.row.drawer],
    ['action', (styles: Styles): object => styles.action],
    ['drawer action', (styles: Styles): object => styles.actionDrawer],
    ['desktop sub-item', (styles: Styles): object => styles.sub.desktop],
    ['tablet sub-item', (styles: Styles): object => styles.sub.tablet],
    ['drawer sub-item', (styles: Styles): object => styles.sub.drawer],
  ])(
    'keeps a visited %s in the label colour, ahead of hover and the current row',
    async (_name, pick) => {
      const anchor = pick(await loadStyles());
      const keys = Object.keys(anchor);

      expect(anchor).toHaveProperty(['&:visited'], { color: '#404142' });
      expect(keys.indexOf('&:visited')).toBeGreaterThan(-1);
      expect(keys.indexOf('&:visited')).toBeLessThan(keys.indexOf('&:hover'));
      expect(keys.indexOf('&:hover')).toBeLessThan(keys.indexOf('&[aria-current="page"]'));
    }
  );

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
