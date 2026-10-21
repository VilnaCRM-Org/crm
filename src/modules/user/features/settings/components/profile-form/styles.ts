import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { md, lg } = breakpointsTheme.breakpoints.values;

export const SETTINGS_TABLET = `@media (min-width:${md}px)`;

export const SETTINGS_DESKTOP = `@media (min-width:${lg + 1}px)`;

export const SETTINGS_FOCUS_RING = {
  outline: `2px solid ${customColors.text.dark}`,
  outlineOffset: '2px',
};

export const SETTINGS_DIVIDER = {
  marginInline:
    'calc(-1 * var(--settings-card-inset-start)) calc(-1 * var(--settings-card-inset-end))',
  borderTop: `1px solid ${paletteColors.border.default}`,
};

export const SETTINGS_PILL = {
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
  '&:focus-visible': SETTINGS_FOCUS_RING,
};

export const SETTINGS_PILL_FROM_TABLET = {
  fontWeight: 600,
  fontSize: '1.125rem',
  lineHeight: 'normal',
};

export const SETTINGS_OUTLINED_PILL = {
  ...SETTINGS_PILL,
  border: `1px solid ${paletteColors.grey[50]}`,
  backgroundColor: paletteColors.background.default,
  color: customColors.text.dark,
  '&:hover': { backgroundColor: paletteColors.background.paper },
};

const SAVE_WIDTH_FROM_TABLET = 'calc(50% - 0.21875rem)';

const CLEAR_WIDTH_FROM_TABLET = 'calc(50% - 0.28125rem)';

export default {
  sectionTitle: {
    ...SETTINGS_DIVIDER,
    marginTop: '1rem',
    marginBottom: '1rem',
    padding: '0.9375rem var(--settings-card-inset-end) 0 var(--settings-card-inset-start)',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    outline: 'none',
    [SETTINGS_TABLET]: {
      marginTop: '1.5rem',
      marginBottom: '0.8125rem',
      paddingTop: '1.4375rem',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
    },
    [SETTINGS_DESKTOP]: { marginBottom: '1rem' },
  },
  field: {
    marginBottom: '1rem',
    flexWrap: 'nowrap',
    '& label': { lineHeight: '1.125rem' },
    '& .MuiTextField-root': { minWidth: 0 },
    '& .MuiOutlinedInput-input': { color: customColors.text.dark },
    [SETTINGS_TABLET]: {
      marginBottom: '0.8125rem',
      flexDirection: 'row',
      alignItems: 'flex-start',
      '& label': {
        flex: '0 0 10.8125rem',
        display: 'flex',
        alignItems: 'center',
        minHeight: '4.375rem',
        margin: 0,
        fontSize: '1.125rem',
        lineHeight: '1.375rem',
      },
      '& .MuiTextField-root': { flex: '1 1 0' },
      '& .MuiOutlinedInput-input': {
        height: '4.375rem',
        maxHeight: 'none',
        paddingTop: '1.625rem',
        paddingBottom: '1.625rem',
        fontSize: '1.125rem',
      },
    },
    [SETTINGS_DESKTOP]: {
      marginBottom: '0.75rem',
      '& label': {
        flexBasis: '9.5rem',
        minHeight: '4rem',
        fontSize: '1rem',
        lineHeight: '1.125rem',
      },
      '& .MuiOutlinedInput-input': {
        height: '4rem',
        paddingTop: '1.4375rem',
        paddingBottom: '1.4375rem',
        fontSize: '1rem',
      },
      '& .MuiOutlinedInput-input::placeholder': { fontSize: '1rem', lineHeight: '1.125rem' },
    },
  },
  emailRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '0.5rem',
    rowGap: '0.25rem',
    margin: '-0.5rem 0 -0.0625rem',
    fontFamily: 'Inter',
    fontSize: '0.875rem',
    lineHeight: '1.125rem',
    [SETTINGS_TABLET]: {
      margin: '-0.1875rem 0 -0.4375rem 10.8125rem',
      fontSize: '1.125rem',
      lineHeight: '1.375rem',
    },
    [SETTINGS_DESKTOP]: {
      margin: '-0.1875rem 0 0 9.5rem',
      fontSize: '1rem',
      lineHeight: '1.125rem',
    },
  },
  emailStatus: {
    margin: 0,
    fontWeight: 400,
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
    color: customColors.text.muted,
    [SETTINGS_TABLET]: { lineHeight: '1.125rem' },
  },
  resendLink: {
    minHeight: '1.5rem',
    margin: '-0.1875rem 0',
    [SETTINGS_TABLET]: { marginBlock: '-0.0625rem' },
    [SETTINGS_DESKTOP]: { marginBlock: '-0.1875rem' },
  },
  actionsDivider: {
    ...SETTINGS_DIVIDER,
    marginTop: '1rem',
    marginBottom: '0.9375rem',
    [SETTINGS_TABLET]: { marginTop: '1.5rem' },
    [SETTINGS_DESKTOP]: { marginBottom: '1.4375rem' },
  },
  status: {
    margin: 0,
    fontFamily: 'Golos',
    fontSize: '0.9375rem',
    lineHeight: '1.5625rem',
    color: customColors.text.primary,
    '&:not(:empty)': { marginBottom: '1rem' },
  },
  saveButton: {
    '&&': {
      ...SETTINGS_PILL,
      display: 'inline-flex',
      width: '100%',
      height: '3.125rem',
      [SETTINGS_TABLET]: {
        ...SETTINGS_PILL_FROM_TABLET,
        width: SAVE_WIDTH_FROM_TABLET,
        height: '4.375rem',
        marginRight: '0.5rem',
      },
      [SETTINGS_DESKTOP]: { width: '16.875rem', height: '3.875rem' },
    },
  },
  clearButton: {
    '&&': {
      ...SETTINGS_OUTLINED_PILL,
      display: 'inline-flex',
      width: '100%',
      height: '3.125rem',
      marginTop: '0.25rem',
      '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
      '&[aria-disabled="true"]:hover': { backgroundColor: paletteColors.background.default },
      [SETTINGS_TABLET]: {
        ...SETTINGS_PILL_FROM_TABLET,
        width: CLEAR_WIDTH_FROM_TABLET,
        height: '4.375rem',
        marginTop: 0,
      },
      [SETTINGS_DESKTOP]: { width: '11.25rem', height: '3.875rem' },
    },
  },
} as const;
