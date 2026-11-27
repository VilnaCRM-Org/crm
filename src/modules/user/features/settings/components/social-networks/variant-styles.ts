import { customColors, paletteColors } from '@/styles/colors';

import { SETTINGS_FOCUS_RING, SETTINGS_TABLET } from '../profile-form/styles';

const FORCED_COLORS = '@media (forced-colors: active)';

const DISABLED = '&[aria-disabled="true"]';

const ENABLED_HOVER = '&:hover:not([aria-disabled="true"])';

const ENABLED_ACTIVE = '&:active:not([aria-disabled="true"])';

const PILL_TEXT_MODE = '@container (min-width: 16rem)';

const DANGER_HOVER = '#DF7878';

const DANGER_BACKDROP = 'rgba(220, 57, 57, 0.1)';

const DISABLED_INK = '#D0D4D8';

const FORCED_GRAY = { color: 'GrayText', borderColor: 'GrayText' };

const FORCED_INK = {
  [FORCED_COLORS]: {
    color: 'ButtonText',
    borderColor: 'ButtonText',
    backgroundColor: 'transparent',
    [DISABLED]: { ...FORCED_GRAY, '&:hover': FORCED_GRAY },
  },
};

const PILL_BUSY = {
  backgroundColor: paletteColors.background.subtle,
  color: paletteColors.background.default,
  borderColor: 'transparent',
  cursor: 'default',
};

export default {
  linkedBadge: {
    justifyContent: 'flex-start',
    gap: '0.375rem',
    paddingInline: '1.4375rem 0.9375rem',
    [SETTINGS_TABLET]: { justifyContent: 'center', gap: '0.5625rem', paddingInline: 0 },
  },
  badgeSlot: {
    display: 'inline-flex',
    flexShrink: 0,
    marginInlineEnd: 'auto',
    [SETTINGS_TABLET]: { marginInlineEnd: 0 },
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
    color: paletteColors.error.main,
    [ENABLED_HOVER]: { color: DANGER_HOVER },
    [ENABLED_ACTIVE]: { color: DANGER_HOVER, backgroundColor: DANGER_BACKDROP },
    '&:focus-visible': SETTINGS_FOCUS_RING,
    [DISABLED]: { cursor: 'default', color: DISABLED_INK, opacity: 1 },
    ...FORCED_INK,
  },
  linkedLabelled: {
    justifyContent: 'space-between',
    paddingInline: '1.4375rem 0.3125rem',
    borderColor: customColors.brand.blue,
    borderWidth: '2px',
    containerType: 'inline-size',
    [SETTINGS_TABLET]: { justifyContent: 'center', paddingInline: 0 },
  },
  unlinkPill: {
    flexShrink: 0,
    width: '2.75rem',
    minWidth: '2.75rem',
    height: '2.75rem',
    minHeight: '2.75rem',
    padding: 0,
    borderRadius: '50%',
    [PILL_TEXT_MODE]: { width: 'auto', padding: '0.75rem 1.4375rem', borderRadius: '3.563rem' },
    '&:focus-visible': { ...SETTINGS_FOCUS_RING, boxShadow: 'none' },
    [DISABLED]: { ...PILL_BUSY, '&:hover': PILL_BUSY },
    ...FORCED_INK,
  },
  pillIcon: { [PILL_TEXT_MODE]: { display: 'none' } },
  pillText: { display: 'none', [PILL_TEXT_MODE]: { display: 'inline' } },
};
