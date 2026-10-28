import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-sidebar/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-sidebar/styles')).default);

describe('sidebar styles', () => {
  it('pins wrapper', async () => {
    const styles = await loadStyles();

    expect(styles.wrapper).toEqual({
      desktop: {
        expanded: {
          position: 'relative',
          flexShrink: 0,
          transition: 'width 200ms ease-out',
          '@media (prefers-reduced-motion: reduce)': {
            transitionDuration: '0s',
          },
          width: '238px',
        },
        rail: {
          position: 'relative',
          flexShrink: 0,
          transition: 'width 200ms ease-out',
          '@media (prefers-reduced-motion: reduce)': {
            transitionDuration: '0s',
          },
          width: '72px',
          marginRight: '41px',
        },
      },
      tablet: {
        expanded: {
          position: 'relative',
          flexShrink: 0,
          transition: 'width 200ms ease-out',
          '@media (prefers-reduced-motion: reduce)': {
            transitionDuration: '0s',
          },
          width: '238px',
        },
        rail: {
          position: 'relative',
          flexShrink: 0,
          transition: 'width 200ms ease-out',
          '@media (prefers-reduced-motion: reduce)': {
            transitionDuration: '0s',
          },
          width: '76px',
        },
      },
    });
  });

  it('pins panel', async () => {
    const styles = await loadStyles();

    expect(styles.panel).toEqual({
      desktop: {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        border: '1px solid #E1E7EA',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
        height: '791px',
        maxHeight: 'calc(100vh - 86px)',
        padding: '20px 0 21px',
      },
      tablet: {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        border: '1px solid #E1E7EA',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
        height: '1142px',
        maxHeight: 'calc(100vh - 86px)',
        padding: '23px 0 29px',
      },
    });
  });

  it('takes the panel block size from the layout, so the placeholder cannot drift', async () => {
    const styles = await loadStyles();
    const { default: layoutStyles } = await import('@/components/layouts/app-layout.styles');

    expect(styles.panel.desktop).toEqual(expect.objectContaining(layoutStyles.navPanel.desktop));
    expect(styles.panel.tablet).toEqual(expect.objectContaining(layoutStyles.navPanel.tablet));
  });

  it('pins handle', async () => {
    const styles = await loadStyles();

    expect(styles.handle).toEqual({
      desktop: {
        expanded: {
          position: 'absolute',
          zIndex: 1,
          boxSizing: 'border-box',
          display: 'block',
          margin: 0,
          padding: 0,
          border: '1px solid #E1E7EA',
          borderRadius: '33px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 5px rgba(33, 39, 46, 0.12)',
          color: '#969B9D',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: '2px solid #1A1C1E',
            outlineOffset: '2px',
          },
          '&:focus:not(:focus-visible)': {
            outline: 'none',
          },
          top: '15px',
          left: '223px',
          width: '24px',
          height: '24px',
        },
        rail: {
          position: 'absolute',
          zIndex: 1,
          boxSizing: 'border-box',
          display: 'block',
          margin: 0,
          padding: 0,
          border: '1px solid #E1E7EA',
          borderRadius: '33px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 5px rgba(33, 39, 46, 0.12)',
          color: '#969B9D',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: '2px solid #1A1C1E',
            outlineOffset: '2px',
          },
          '&:focus:not(:focus-visible)': {
            outline: 'none',
          },
          top: '15px',
          left: '57px',
          width: '24px',
          height: '24px',
        },
      },
      tablet: {
        expanded: {
          position: 'absolute',
          zIndex: 1,
          boxSizing: 'border-box',
          display: 'block',
          margin: 0,
          padding: 0,
          border: '1px solid #E1E7EA',
          borderRadius: '33px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 5px rgba(33, 39, 46, 0.12)',
          color: '#969B9D',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: '2px solid #1A1C1E',
            outlineOffset: '2px',
          },
          '&:focus:not(:focus-visible)': {
            outline: 'none',
          },
          top: '15px',
          left: '222px',
          width: '32px',
          height: '32px',
        },
        rail: {
          position: 'absolute',
          zIndex: 1,
          boxSizing: 'border-box',
          display: 'block',
          margin: 0,
          padding: 0,
          border: '1px solid #E1E7EA',
          borderRadius: '33px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 5px rgba(33, 39, 46, 0.12)',
          color: '#969B9D',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: '2px solid #1A1C1E',
            outlineOffset: '2px',
          },
          '&:focus:not(:focus-visible)': {
            outline: 'none',
          },
          top: '15px',
          left: '60px',
          width: '32px',
          height: '32px',
        },
      },
    });
  });

  it('pins handleGlyph', async () => {
    const styles = await loadStyles();

    expect(styles.handleGlyph).toEqual({
      desktop: {
        position: 'absolute',
        top: '2px',
        left: '3px',
        width: '16px',
        height: '16px',
        fill: 'none',
      },
      tablet: {
        position: 'absolute',
        top: '5px',
        left: '5px',
        width: '20px',
        height: '20px',
        fill: 'none',
      },
    });
  });

  it('pins handlePoints', async () => {
    const styles = await loadStyles();

    expect(styles.handlePoints).toEqual({
      expanded: {
        transform: 'none',
      },
      rail: {
        transform: 'rotate(180deg)',
      },
    });
  });
});
