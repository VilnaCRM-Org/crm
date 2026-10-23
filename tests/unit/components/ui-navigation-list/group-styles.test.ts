import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-navigation-list/group-styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-navigation-list/group-styles')).default);

describe('navigation group styles', () => {
  it('pins group', async () => {
    const styles = await loadStyles();

    expect(styles.group).toEqual({
      expanded: {
        position: 'relative',
        flexShrink: 0,
        margin: 0,
        listStyle: 'none',
        padding: '0 0 12px',
      },
      collapsed: {
        position: 'relative',
        flexShrink: 0,
        margin: 0,
        listStyle: 'none',
        padding: 0,
      },
    });
  });

  it('pins subList', async () => {
    const styles = await loadStyles();

    expect(styles.subList).toEqual({
      margin: 0,
      padding: 0,
      listStyle: 'none',
    });
  });

  it('pins toggleBase', async () => {
    const styles = await loadStyles();

    expect(styles.toggleBase).toEqual({
      position: 'absolute',
      display: 'block',
      margin: 0,
      padding: 0,
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: '#969B9D',
      '&:hover': {
        color: '#404142',
      },
      '& svg': {
        display: 'block',
        width: '100%',
        height: '100%',
        fill: 'none',
      },
      '&:focus-visible': {
        outline: '2px solid #1A1C1E',
        outlineOffset: '2px',
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
      },
    });
  });

  it('pins toggle', async () => {
    const styles = await loadStyles();

    expect(styles.toggle).toEqual({
      desktop: {
        left: '192px',
        top: '19px',
        width: '20px',
        height: '20px',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-12px',
        },
      },
      tablet: {
        left: '190px',
        top: '24px',
        width: '24px',
        height: '24px',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-10px',
        },
      },
    });
  });

  it('pins toggleGlyph', async () => {
    const styles = await loadStyles();

    expect(styles.toggleGlyph).toEqual({
      expanded: {
        transform: 'rotate(90deg)',
      },
      collapsed: {
        transform: 'rotate(-90deg)',
      },
    });
  });
});
