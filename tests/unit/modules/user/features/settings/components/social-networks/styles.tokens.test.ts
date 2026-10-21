import loadIsolated from '@tests/unit/utils/isolated-module';

type SocialStyles =
  (typeof import('@/modules/user/features/settings/components/social-networks/styles'))['default'];

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';

const loadStyles = (): Promise<SocialStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/social-networks/styles')).default
  );

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

describe('social networks styles', () => {
  it('pins the card, heading, grid, tile and label tokens of the Figma frames', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      card: {
        marginInline: '-0.4375rem',
        padding: '0.9375rem 1rem 0.9375rem 1.0625rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '0.75rem',
        [TABLET]: { marginInline: 0, padding: '1.1875rem 1.9375rem' },
        [DESKTOP]: { padding: '1.4375rem 1.9375rem 2.625rem 1.875rem' },
      },
      heading: {
        margin: '0 0 1rem',
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: '1.375rem',
        color: '#1A1C1E',
        [TABLET]: {
          marginBottom: '1.25rem',
          fontWeight: 700,
          fontSize: '1.375rem',
          lineHeight: '1.625rem',
        },
        [DESKTOP]: { marginLeft: '0.0625rem' },
      },
      list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(2, auto)',
        gridAutoFlow: 'column',
        columnGap: '0.5625rem',
        rowGap: '0.5rem',
        margin: 0,
        padding: 0,
        listStyle: 'none',
        [TABLET]: { gridAutoFlow: 'row', columnGap: '0.75rem', rowGap: '0.8125rem' },
        [DESKTOP]: { columnGap: '0.25rem', rowGap: '0.5rem' },
      },
      tile: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5625rem',
        boxSizing: 'border-box',
        height: '3.625rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '0.75rem',
        [DESKTOP]: { borderWidth: '2px' },
      },
      icon: { width: '1.375rem', height: '1.375rem' },
      label: {
        ...VISUALLY_HIDDEN,
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 'normal',
        color: '#1A1C1E',
        [TABLET]: {
          position: 'static',
          width: 'auto',
          height: 'auto',
          margin: 0,
          overflow: 'visible',
          clip: 'auto',
        },
      },
      status: VISUALLY_HIDDEN,
    });
  });
});
