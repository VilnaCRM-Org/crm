import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { md, lg, xl } = breakpointsTheme.breakpoints.values;

const PILL = {
  minWidth: 0,
  maxHeight: 'none',
  paddingTop: 0,
  paddingBottom: 0,
  borderRadius: '3.5625rem',
  fontFamily: 'Golos',
  fontWeight: 600,
  fontSize: '1.125rem',
  lineHeight: 'normal',
  textTransform: 'none',
};

const MOBILE_PILL = { ...PILL, width: '100%', height: '3.125rem' };

const SAVE_PILL = { ...PILL, width: '16.875rem', height: '3.875rem', marginTop: '1.5rem' };

const CLEAR_PILL = { ...PILL, width: '11.25rem', height: '3.875rem', marginTop: '1.5rem' };

export default {
  sectionTitle: {
    margin: '0 0 1.5rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${paletteColors.border.default}`,
    fontFamily: 'Golos',
    fontWeight: 700,
    fontSize: '1.125rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
    outline: 'none',
    [`@media (min-width:${md}px)`]: { fontSize: '1.375rem' },
  },
  field: {
    marginBottom: '1.25rem',
    [`@media (min-width:${lg}px)`]: {
      flexDirection: 'row',
      alignItems: 'center',
      '& label': { flex: '0 0 9.5rem', marginBottom: 0 },
    },
  },
  emailRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    margin: '-0.75rem 0 1.25rem',
    fontFamily: 'Inter',
    fontSize: '0.875rem',
    lineHeight: '1.125rem',
    [`@media (min-width:${md}px)`]: { fontSize: '1rem' },
    [`@media (min-width:${lg}px)`]: { marginLeft: '9.5rem' },
  },
  emailStatus: { margin: 0, fontWeight: 400, color: customColors.text.muted },
  resendLink: {
    minHeight: '1.5rem',
    padding: 0,
    border: 0,
    background: 'none',
    font: 'inherit',
    fontWeight: 500,
    color: paletteColors.primary.linkText,
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    cursor: 'pointer',
    '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
    '&:focus-visible': {
      outline: `2px solid ${paletteColors.primary.linkText}`,
      outlineOffset: '2px',
    },
  },
  hint: {
    margin: '0 0 1rem',
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: customColors.text.muted,
  },
  status: {
    margin: 0,
    fontFamily: 'Golos',
    fontSize: '0.9375rem',
    color: customColors.text.primary,
    '&:not(:empty)': { marginTop: '1rem' },
  },
  saveButton: {
    display: 'inline-flex',
    ...MOBILE_PILL,
    marginTop: '1rem',
    [`@media (min-width:${md}px)`]: { ...SAVE_PILL, marginRight: '0.5rem' },
    [`@media (min-width:${lg}px)`]: SAVE_PILL,
    [`@media (min-width:${xl}px)`]: SAVE_PILL,
  },
  clearButton: {
    display: 'inline-flex',
    ...MOBILE_PILL,
    marginTop: '0.25rem',
    border: `1px solid ${paletteColors.grey[50]}`,
    backgroundColor: paletteColors.background.default,
    color: customColors.text.dark,
    '&:hover': { backgroundColor: paletteColors.background.paper },
    '&[aria-disabled="true"]': { cursor: 'default', opacity: 0.6 },
    '&[aria-disabled="true"]:hover': { backgroundColor: paletteColors.background.default },
    '&:focus-visible': { outline: `2px solid ${customColors.text.dark}`, outlineOffset: '2px' },
    [`@media (min-width:${md}px)`]: CLEAR_PILL,
  },
} as const;
