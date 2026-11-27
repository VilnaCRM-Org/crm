import loadIsolated from '@tests/unit/utils/isolated-module';

type SocialStyles =
  (typeof import('@/modules/user/features/settings/components/social-networks/styles'))['default'];

const TABLET = '@media (min-width:768px)';
const DESKTOP = '@media (min-width:1025px)';

const FORCED_COLORS = '@media (forced-colors: active)';
const DISABLED = '&[aria-disabled="true"]';
const ENABLED_HOVER = '&:hover:not([aria-disabled="true"])';
const FOCUS_RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

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
        '&:focus:not(:focus-visible)': { outline: 'none' },
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
      item: { minWidth: 0 },
      tile: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5625rem',
        boxSizing: 'border-box',
        minHeight: '3.625rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '0.75rem',
        [DESKTOP]: { borderWidth: '2px' },
      },
      link: {
        padding: 0,
        cursor: 'pointer',
        [ENABLED_HOVER]: { backgroundColor: '#FBFBFB' },
        '&:focus-visible': FOCUS_RING,
        [DISABLED]: { cursor: 'default', opacity: 0.6 },
        [FORCED_COLORS]: {
          borderColor: 'ButtonText',
          [DISABLED]: { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
        },
      },
      linked: {
        justifyContent: 'space-between',
        paddingInline: '1.4375rem 0.9375rem',
        backgroundColor: '#E8F7FF',
        borderColor: '#1EAEFF',
        [TABLET]: { justifyContent: 'center', paddingInline: 0 },
      },
      unlink: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.75rem',
        height: '2.75rem',
        marginInline: '-0.625rem',
        padding: 0,
        border: 0,
        borderRadius: '0.5rem',
        background: 'none',
        cursor: 'pointer',
        color: '#1EAEFF',
        [ENABLED_HOVER]: { color: '#00A3FF' },
        '&:focus-visible': FOCUS_RING,
        [DISABLED]: { cursor: 'default', opacity: 0.6 },
        [FORCED_COLORS]: {
          color: 'ButtonText',
          [DISABLED]: { color: 'GrayText', opacity: 1 },
        },
      },
      unlinkIcon: { width: '1.5rem', height: '1.5rem', fill: 'none' },
      icon: {
        width: '1.375rem',
        height: '1.375rem',
        [FORCED_COLORS]: { '& [fill="black"]': { fill: 'currentColor' } },
      },
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
      failure: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1rem',
        marginTop: '1rem',
        fontFamily: 'Golos',
      },
      failureMessage: {
        margin: 0,
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 'normal',
        color: '#1A1C1E',
      },
      confirmation: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginTop: '1rem',
        fontFamily: 'Golos',
        overflowWrap: 'anywhere',
        [TABLET]: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
      confirmationActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        [TABLET]: { flexDirection: 'row' },
      },
      confirmationButton: {
        '&&': {
          minHeight: '2.75rem',
          [DISABLED]: {
            cursor: 'default',
            opacity: 0.6,
            '&:hover': { backgroundColor: '#FFFFFF' },
          },
          [FORCED_COLORS]: {
            [DISABLED]: { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
          },
        },
      },
      retryButton: {
        '&&': {
          minWidth: 0,
          maxHeight: 'none',
          margin: 0,
          padding: '0 1.5rem',
          borderRadius: '3.5625rem',
          fontFamily: 'Golos',
          fontWeight: 500,
          fontSize: '0.9375rem',
          lineHeight: '1.125rem',
          letterSpacing: 0,
          textTransform: 'none',
          '&:focus-visible': FOCUS_RING,
          border: '1px solid #969B9D',
          backgroundColor: '#FFFFFF',
          color: '#1A1C1E',
          '&:hover': { backgroundColor: '#F4F5F6' },
          width: '100%',
          height: '3.125rem',
          [DISABLED]: {
            cursor: 'default',
            opacity: 0.6,
            '&:hover': { backgroundColor: '#FFFFFF' },
          },
          [FORCED_COLORS]: {
            [DISABLED]: { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
          },
          [TABLET]: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 'normal',
            width: 'auto',
            minWidth: '11.25rem',
          },
        },
      },
    });
  });
});
