import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-navigation-drawer/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-drawer/styles')).default);

describe('navigation drawer styles', () => {
  it('pins scrim', async () => {
    const styles = await loadStyles();

    expect(styles.scrim).toEqual({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      backgroundColor: 'rgba(54, 79, 93, 0.05)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    });
  });

  it('leaves the backdrop unpainted', async () => {
    const styles = await loadStyles();

    expect(styles).not.toHaveProperty('backdrop');
  });

  it('pins dialog', async () => {
    const styles = await loadStyles();

    expect(styles.dialog).toEqual({
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      outline: 'none',
    });
  });

  it('pins header', async () => {
    const styles = await loadStyles();

    expect(styles.header).toEqual({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      height: '56px',
      padding: '0 15px',
      pointerEvents: 'auto',
      backgroundColor: '#FFFFFF',
      '@media (max-width:374px)': {
        padding: '0 8px',
      },
    });
  });

  it('pins logo', async () => {
    const styles = await loadStyles();

    expect(styles.logo).toEqual({
      display: 'block',
      flexShrink: 0,
      width: '125px',
      height: '42.067px',
      marginTop: '7px',
    });
  });

  it('pins cluster', async () => {
    const styles = await loadStyles();

    expect(styles.cluster).toEqual({
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      gap: '16px',
      width: '160px',
      height: '40px',
      marginTop: '8px',
    });
  });

  it('pins glyph', async () => {
    const styles = await loadStyles();

    expect(styles.glyph).toEqual({
      display: 'block',
      flexShrink: 0,
      width: '24px',
      height: '24px',
      color: '#D0D4D8',
    });
  });

  it('pins avatar', async () => {
    const styles = await loadStyles();

    expect(styles.avatar).toEqual({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxSizing: 'border-box',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#E1E7EA',
      color: '#1A1C1E',
    });
  });

  it('pins avatarGlyph', async () => {
    const styles = await loadStyles();

    expect(styles.avatarGlyph).toEqual({ fontSize: '24px' });
  });

  it('pins close', async () => {
    const styles = await loadStyles();

    expect(styles.close).toEqual({
      '&:focus-visible': {
        outline: '2px solid #1A1C1E',
        outlineOffset: '2px',
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
      },
      display: 'block',
      flexShrink: 0,
      boxSizing: 'border-box',
      width: '44px',
      height: '44px',
      margin: '-10px',
      padding: '10px',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: '#404142',
      '@media (max-width:374px)': {
        '&:focus-visible': { outlineOffset: '-2px' },
        margin: '-10px -8px -10px -12px',
        padding: '10px 8px 10px 12px',
      },
    });
  });

  it('pins closeGlyph', async () => {
    const styles = await loadStyles();

    expect(styles.closeGlyph).toEqual({
      display: 'block',
      flexShrink: 0,
      width: '24px',
      height: '24px',
    });
  });

  it('pins panel', async () => {
    const styles = await loadStyles();

    expect(styles.panel).toEqual({
      position: 'absolute',
      top: '56px',
      right: 0,
      boxSizing: 'border-box',
      width: 'min(313px, calc(100vw - 7px))',
      height: '622px',
      maxHeight: 'calc(100vh - 56px)',
      overflowX: 'hidden',
      overflowY: 'auto',
      pointerEvents: 'auto',
      backgroundColor: '#FFFFFF',
      boxShadow: '-9px 4px 33px rgba(53, 59, 72, 0.07)',
      '&:focus:not(:focus-visible)': { outline: 'none' },
    });
  });

  it('carries no nav entry, since the drawer panel styles its nav through the list', async () => {
    const styles = await loadStyles();

    expect(styles).not.toHaveProperty('nav');
  });
});
