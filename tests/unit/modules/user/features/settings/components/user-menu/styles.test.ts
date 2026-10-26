import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles =
  (typeof import('@/modules/user/features/settings/components/user-menu/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/user-menu/styles')).default
  );

describe('user menu styles', () => {
  it('pins root', async () => {
    const styles = await loadStyles();

    expect(styles.root).toEqual({
      desktop: {
        position: 'relative',
        flexShrink: 0,
        width: 'max-content',
        minWidth: '225px',
        height: '48px',
      },
      tablet: {
        position: 'relative',
        flexShrink: 0,
        width: 'max-content',
        minWidth: '253px',
        height: '52px',
      },
      mobile: {
        position: 'relative',
        flexShrink: 0,
        width: '40px',
        height: '40px',
      },
    });
  });

  it('pins backdrop', async () => {
    const styles = await loadStyles();

    expect(styles.backdrop).toEqual({
      position: 'fixed',
      inset: 0,
      zIndex: 1,
    });
  });

  it('pins card', async () => {
    const styles = await loadStyles();

    expect(styles.card).toEqual({
      desktop: {
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
        border: '1px solid #D0D4D8',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        minWidth: '225px',
        minHeight: '48px',
      },
      tablet: {
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
        border: '1px solid #D0D4D8',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        minWidth: '253px',
        minHeight: '52px',
      },
      open: {
        boxShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
      },
    });
  });

  it('pins chip', async () => {
    const styles = await loadStyles();

    expect(styles.chip).toEqual({
      desktop: {
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        position: 'relative',
        display: 'block',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '7px',
        fontFamily: 'Inter, sans-serif',
        height: '46px',
      },
      tablet: {
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        position: 'relative',
        display: 'block',
        boxSizing: 'border-box',
        width: '100%',
        margin: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '7px',
        fontFamily: 'Inter, sans-serif',
        height: '50px',
      },
      mobile: {
        '&:focus-visible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '2px',
        },
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        position: 'absolute',
        display: 'block',
        boxSizing: 'border-box',
        width: '44px',
        margin: 0,
        padding: '2px',
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '50%',
        fontFamily: 'Inter, sans-serif',
        inset: '-2px',
        height: '44px',
      },
    });
  });

  it('pins avatar', async () => {
    const styles = await loadStyles();

    expect(styles.avatar).toEqual({
      chip: {
        desktop: {
          left: '7px',
          top: '6px',
        },
        tablet: {
          left: '15px',
          top: '9px',
        },
      },
      base: {
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#E1E7EA',
        color: '#1A1C1E',
        fontFamily: 'Golos',
        fontWeight: 700,
        lineHeight: 1,
      },
      sizes: {
        chip: {
          width: '32px',
          height: '32px',
          fontSize: '12px',
        },
        avatar: {
          position: 'relative',
          width: '40px',
          height: '40px',
          fontSize: '15px',
        },
      },
    });
  });

  it('pins glyph', async () => {
    const styles = await loadStyles();

    expect(styles.glyph).toEqual({
      chip: {
        fontSize: '20px',
      },
      avatar: {
        fontSize: '24px',
      },
    });
  });

  it('pins caret', async () => {
    const styles = await loadStyles();

    expect(styles.caret).toEqual({
      desktop: {
        position: 'absolute',
        width: '20px',
        height: '20px',
        transform: 'rotate(-90deg)',
        fill: 'none',
        color: '#969B9D',
        right: '12px',
        top: '13px',
      },
      tablet: {
        position: 'absolute',
        width: '20px',
        height: '20px',
        transform: 'rotate(-90deg)',
        fill: 'none',
        color: '#969B9D',
        right: '15px',
        top: '15px',
      },
    });
  });

  it('pins list', async () => {
    const styles = await loadStyles();

    expect(styles.list).toEqual({
      desktop: {
        margin: '1px -1px -1px',
        padding: 0,
        listStyle: 'none',
      },
      tablet: {
        margin: '1px -1px -1px',
        padding: 0,
        listStyle: 'none',
      },
      mobile: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
    });
  });

  it('pins item', async () => {
    const styles = await loadStyles();

    expect(styles.item).toEqual({
      desktop: {
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        minHeight: 0,
        padding: '0 0 0 20px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color: '#1A1C1E',
        textDecoration: 'none',
        '&:hover, &:focus-visible, &.Mui-focusVisible': {
          backgroundColor: '#F4F5F6',
        },
        '&:focus-visible, &.Mui-focusVisible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&[href]:first-of-type, &:only-child': {
          borderTop: '1px solid #E1E7EA',
        },
        '&:last-child': {
          borderRadius: '0 0 7px 7px',
        },
        height: '44px',
        fontSize: '14px',
        lineHeight: '18px',
      },
      tablet: {
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        minHeight: 0,
        padding: '0 0 0 20px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color: '#1A1C1E',
        textDecoration: 'none',
        '&:hover, &:focus-visible, &.Mui-focusVisible': {
          backgroundColor: '#F4F5F6',
        },
        '&:focus-visible, &.Mui-focusVisible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        '&[href]:first-of-type, &:only-child': {
          borderTop: '1px solid #E1E7EA',
        },
        '&:last-child': {
          borderRadius: '0 0 7px 7px',
        },
        height: '60px',
        fontSize: '16px',
        lineHeight: '18px',
      },
      mobile: {
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        minHeight: 0,
        padding: '0 0 0 20px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color: '#1A1C1E',
        textDecoration: 'none',
        '&:hover, &:focus-visible, &.Mui-focusVisible': {
          backgroundColor: '#F4F5F6',
        },
        '&:focus-visible, &.Mui-focusVisible': {
          outline: '2px solid #1A1C1E',
          outlineOffset: '-2px',
        },
        height: '44px',
        fontSize: '14px',
        lineHeight: '18px',
      },
    });
  });

  it('pins popover', async () => {
    const styles = await loadStyles();

    expect(styles.popover).toEqual({
      position: 'absolute',
      top: '45px',
      right: '-45px',
      zIndex: 2,
      width: '225px',
    });
  });

  it('pins popoverCaret', async () => {
    const styles = await loadStyles();

    expect(styles.popoverCaret).toEqual({
      marginLeft: '148px',
      width: '26px',
      height: '6px',
      backgroundColor: '#E1E7EA',
      clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
    });
  });

  it('pins popoverBody', async () => {
    const styles = await loadStyles();

    expect(styles.popoverBody).toEqual({
      boxSizing: 'border-box',
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      boxShadow: 'inset 0 0 0 1px #D0D4D8, 0 8px 27px rgba(49, 59, 67, 0.14)',
      overflow: 'hidden',
    });
  });
});
