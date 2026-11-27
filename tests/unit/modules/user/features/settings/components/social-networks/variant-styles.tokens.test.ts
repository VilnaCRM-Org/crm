import loadIsolated from '@tests/unit/utils/isolated-module';

type VariantStylesModule =
  typeof import('@/modules/user/features/settings/components/social-networks/variant-styles');

type VariantStyles = VariantStylesModule['default'];

const TABLET = '@media (min-width:768px)';
const FORCED_COLORS = '@media (forced-colors: active)';
const DISABLED = '&[aria-disabled="true"]';
const ENABLED_HOVER = '&:hover:not([aria-disabled="true"])';
const ENABLED_ACTIVE = '&:active:not([aria-disabled="true"])';
const TEXT_MODE = '@container (min-width: 16rem)';
const FOCUS_RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

const FORCED_INK = {
  [FORCED_COLORS]: {
    color: 'ButtonText',
    borderColor: 'ButtonText',
    backgroundColor: 'transparent',
    [DISABLED]: {
      color: 'GrayText',
      borderColor: 'GrayText',
      '&:hover': { color: 'GrayText', borderColor: 'GrayText' },
    },
  },
};

const PILL_BUSY = {
  backgroundColor: '#E1E7EA',
  color: '#FFFFFF',
  borderColor: 'transparent',
  cursor: 'default',
};

const loadStyles = (): Promise<VariantStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/social-networks/variant-styles'))
        .default
  );

describe('social tile variant styles', () => {
  it('pins the badge tile, its slot, its forced colours and the danger-lane bin', async () => {
    const styles = await loadStyles();

    expect({
      linkedBadge: styles.linkedBadge,
      badgeSlot: styles.badgeSlot,
      badge: styles.badge,
      unlinkDanger: styles.unlinkDanger,
    }).toEqual({
      linkedBadge: {
        justifyContent: 'flex-start',
        gap: '0.375rem',
        paddingInline: '1.4375rem 0.9375rem',
        [TABLET]: { justifyContent: 'center', gap: '0.5625rem', paddingInline: 0 },
      },
      badgeSlot: {
        display: 'inline-flex',
        flexShrink: 0,
        marginInlineEnd: 'auto',
        [TABLET]: { marginInlineEnd: 0 },
      },
      badge: {
        [FORCED_COLORS]: {
          backgroundColor: 'Canvas',
          borderColor: 'CanvasText',
          color: 'CanvasText',
        },
      },
      unlinkDanger: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.75rem',
        height: '2.75rem',
        marginInline: '-0.625rem',
        padding: '0.125rem',
        border: 0,
        borderRadius: '0.625rem',
        backgroundColor: 'transparent',
        backgroundClip: 'content-box',
        cursor: 'pointer',
        color: '#DC3939',
        [ENABLED_HOVER]: { color: '#DF7878' },
        [ENABLED_ACTIVE]: { color: '#DF7878', backgroundColor: 'rgba(220, 57, 57, 0.1)' },
        '&:focus-visible': FOCUS_RING,
        [DISABLED]: { cursor: 'default', color: '#D0D4D8', opacity: 1 },
        ...FORCED_INK,
      },
    });
  });

  it('pins the labelled tile, the folding pill and its glyph and word', async () => {
    const styles = await loadStyles();

    expect({
      linkedLabelled: styles.linkedLabelled,
      unlinkPill: styles.unlinkPill,
      pillIcon: styles.pillIcon,
      pillText: styles.pillText,
    }).toEqual({
      linkedLabelled: {
        justifyContent: 'space-between',
        paddingInline: '1.4375rem 0.3125rem',
        borderColor: '#1EAEFF',
        borderWidth: '2px',
        containerType: 'inline-size',
        [TABLET]: { justifyContent: 'center', paddingInline: 0 },
      },
      unlinkPill: {
        flexShrink: 0,
        width: '2.75rem',
        minWidth: '2.75rem',
        height: '2.75rem',
        minHeight: '2.75rem',
        padding: 0,
        borderRadius: '50%',
        [TEXT_MODE]: { width: 'auto', padding: '0.75rem 1.4375rem', borderRadius: '3.563rem' },
        '&:focus-visible': { ...FOCUS_RING, boxShadow: 'none' },
        [DISABLED]: { ...PILL_BUSY, '&:hover': PILL_BUSY },
        ...FORCED_INK,
      },
      pillIcon: { [TEXT_MODE]: { display: 'none' } },
      pillText: { display: 'none', [TEXT_MODE]: { display: 'inline' } },
    });
  });

  it('declares no style the two variants do not use', async () => {
    expect(Object.keys(await loadStyles())).toEqual([
      'linkedBadge',
      'badgeSlot',
      'badge',
      'unlinkDanger',
      'linkedLabelled',
      'unlinkPill',
      'pillIcon',
      'pillText',
    ]);
  });
});
