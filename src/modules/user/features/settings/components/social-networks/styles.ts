import { customColors, paletteColors } from '@/styles/colors';

import {
  SETTINGS_DESKTOP,
  SETTINGS_OUTLINED_PILL,
  SETTINGS_PILL_FROM_TABLET,
  SETTINGS_TABLET,
} from '../profile-form/styles';

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

const FOCUS_RING = { outline: `2px solid ${customColors.text.dark}`, outlineOffset: '2px' };

const FORCED_COLORS = '@media (forced-colors: active)';

const DISABLED = '&[aria-disabled="true"]';

const ENABLED_HOVER = '&:hover:not([aria-disabled="true"])';

const DIMMED = { cursor: 'default', opacity: 0.6 };

const DIMMED_BUTTON = {
  ...DIMMED,
  '&:hover': { backgroundColor: paletteColors.background.default },
};

const GRAYED_OUT = { borderColor: 'GrayText', color: 'GrayText', opacity: 1 };

const FORCED_GRAYED_OUT = { [DISABLED]: GRAYED_OUT };

export default {
  card: {
    marginInline: '-0.4375rem',
    padding: '0.9375rem 1rem 0.9375rem 1.0625rem',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    [SETTINGS_TABLET]: {
      marginInline: 0,
      padding: '1.1875rem 1.9375rem',
    },
    [SETTINGS_DESKTOP]: {
      padding: '1.4375rem 1.9375rem 2.625rem 1.875rem',
    },
  },
  heading: {
    margin: '0 0 1rem',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: '1.375rem',
    color: customColors.text.dark,
    '&:focus:not(:focus-visible)': { outline: 'none' },
    [SETTINGS_TABLET]: {
      marginBottom: '1.25rem',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
    },
    [SETTINGS_DESKTOP]: { marginLeft: '0.0625rem' },
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
    [SETTINGS_TABLET]: {
      gridAutoFlow: 'row',
      columnGap: '0.75rem',
      rowGap: '0.8125rem',
    },
    [SETTINGS_DESKTOP]: { columnGap: '0.25rem', rowGap: '0.5rem' },
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
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    [SETTINGS_DESKTOP]: { borderWidth: '2px' },
  },
  link: {
    padding: 0,
    cursor: 'pointer',
    [ENABLED_HOVER]: { backgroundColor: customColors.surface.page },
    '&:focus-visible': FOCUS_RING,
    [DISABLED]: DIMMED,
    [FORCED_COLORS]: { borderColor: 'ButtonText', [DISABLED]: GRAYED_OUT },
  },
  linked: {
    justifyContent: 'space-between',
    paddingInline: '1.4375rem 0.9375rem',
    backgroundColor: customColors.surface.brandTint,
    borderColor: customColors.brand.blue,
    [SETTINGS_TABLET]: { justifyContent: 'center', paddingInline: 0 },
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
    color: customColors.brand.blue,
    [ENABLED_HOVER]: { color: paletteColors.primary.hover },
    '&:focus-visible': FOCUS_RING,
    [DISABLED]: DIMMED,
    [FORCED_COLORS]: {
      color: 'ButtonText',
      [DISABLED]: { color: 'GrayText', opacity: 1 },
    },
  },
  icon: {
    width: '1.375rem',
    height: '1.375rem',
    [FORCED_COLORS]: { '& [fill="black"]': { fill: 'currentColor' } },
  },
  unlinkIcon: { width: '1.5rem', height: '1.5rem', fill: 'none' },
  label: {
    ...VISUALLY_HIDDEN,
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    [SETTINGS_TABLET]: {
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
    color: customColors.text.dark,
  },
  confirmation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
    fontFamily: 'Golos',
    overflowWrap: 'anywhere',
    [SETTINGS_TABLET]: {
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
    [SETTINGS_TABLET]: { flexDirection: 'row' },
  },
  confirmationButton: {
    '&&': {
      minHeight: '2.75rem',
      [DISABLED]: DIMMED_BUTTON,
      [FORCED_COLORS]: FORCED_GRAYED_OUT,
    },
  },
  retryButton: {
    '&&': {
      ...SETTINGS_OUTLINED_PILL,
      width: '100%',
      height: '3.125rem',
      [DISABLED]: DIMMED_BUTTON,
      [FORCED_COLORS]: FORCED_GRAYED_OUT,
      [SETTINGS_TABLET]: { ...SETTINGS_PILL_FROM_TABLET, width: 'auto', minWidth: '11.25rem' },
    },
  },
};
