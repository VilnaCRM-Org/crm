import { customColors, paletteColors } from '@/styles/colors';

import {
  SETTINGS_DESKTOP,
  SETTINGS_FIELD_WIDTH_RESET,
  SETTINGS_FOCUS_RING,
  SETTINGS_PILL,
  SETTINGS_SUBMIT_WIDTH_RESET,
  SETTINGS_TABLET,
} from '../profile-form/styles';

const CARD = {
  marginInline: '-0.4375rem',
  backgroundColor: paletteColors.background.default,
  border: `1px solid ${paletteColors.background.subtle}`,
  borderRadius: '0.75rem',
  fontFamily: 'Golos',
  color: customColors.text.primary,
  minWidth: 0,
  ...SETTINGS_FIELD_WIDTH_RESET,
};

const OUTLINED_BUTTON = {
  ...SETTINGS_PILL,
  height: '2.5rem',
  border: `1px solid ${paletteColors.border.strong}`,
  backgroundColor: paletteColors.background.default,
  color: customColors.brand.darkPrimary,
  '&:hover': { backgroundColor: paletteColors.background.paper },
  '&:focus-visible': SETTINGS_FOCUS_RING,
};

export default {
  card: {
    ...CARD,
    padding: '1.0625rem 1rem 2.1875rem 1.0625rem',
    [SETTINGS_TABLET]: { marginInline: 0, padding: '1.9375rem' },
    [SETTINGS_DESKTOP]: { padding: '1.4375rem 1.9375rem 1.875rem' },
  },
  cardConnected: {
    ...CARD,
    padding: '0.9375rem 1.0625rem',
    [SETTINGS_TABLET]: { marginInline: 0, padding: '1.9375rem' },
    [SETTINGS_DESKTOP]: { padding: '1.6875rem 1.9375rem' },
  },
  submit: SETTINGS_SUBMIT_WIDTH_RESET,
  copyButton: { '&&': OUTLINED_BUTTON },
  actionButton: {
    '&&': {
      ...OUTLINED_BUTTON,
      height: '2.75rem',
      [SETTINGS_TABLET]: {
        height: '3.875rem',
        padding: '0 2rem',
        fontWeight: 600,
        fontSize: '1.125rem',
      },
      [SETTINGS_DESKTOP]: {
        height: '2.625rem',
        padding: '0 1.5rem',
        fontWeight: 500,
        fontSize: '0.9375rem',
      },
    },
  },
  codeList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.5rem',
    margin: '0 0 1rem',
    padding: 0,
    listStyle: 'none',
  },
  codeItem: {
    padding: '0.5rem 0.875rem',
    overflowWrap: 'anywhere',
    backgroundColor: paletteColors.border.default,
    borderRadius: '0.25rem',
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
  },
  savedRow: { margin: '1.25rem 0 0' },
  disableCodeField: {
    '& .MuiOutlinedInput-notchedOutline': { borderColor: paletteColors.border.strong },
  },
  statusHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0 0 1.25rem',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    outline: 'none',
    '&:focus-visible': SETTINGS_FOCUS_RING,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginTop: '0.4375rem',
    marginLeft: '3.25rem',
    [SETTINGS_TABLET]: { marginTop: '1rem', marginLeft: '5.8125rem' },
    [SETTINGS_DESKTOP]: { marginTop: '0.3125rem' },
  },
  footerButton: { '&&': { ...OUTLINED_BUTTON, marginTop: '0.75rem' } },
  reauthMessage: {
    margin: '0 0 1rem',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: customColors.text.dark,
    outline: 'none',
    '&:focus-visible': SETTINGS_FOCUS_RING,
  },
  reauthButton: {
    '&&': {
      ...SETTINGS_PILL,
      height: '2.5rem',
      border: `1px solid ${paletteColors.border.strong}`,
      backgroundColor: paletteColors.background.default,
      color: customColors.text.dark,
      '&:hover': { backgroundColor: paletteColors.background.paper },
      '&:focus-visible': SETTINGS_FOCUS_RING,
    },
  },
  note: {
    margin: '1rem 0 0',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1rem',
    color: customColors.text.primary,
  },
} as const;
