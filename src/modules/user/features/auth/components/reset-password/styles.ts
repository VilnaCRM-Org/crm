import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

export default {
  backControl: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    minHeight: '1.5rem',
    padding: 0,
    position: 'relative',
    marginBottom: '0.625rem',

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
    letterSpacing: 0,
    color: customColors.text.primary,
    textTransform: 'none',

    '& svg': {
      flexShrink: 0,
      color: customColors.text.primary,
    },

    '&:visited': { color: customColors.text.primary },
    '&:hover': { backgroundColor: 'transparent' },

    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '-0.625rem 0',
    },

    '&:focus-visible, &.Mui-focusVisible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
      borderRadius: '0.25rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '0.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '-0.1875rem',
    },
  },

  resultTitle: {
    marginTop: 0,
    marginBottom: '0.5rem',
    '&:focus': { outline: 'none' },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '0.9375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '0.75rem',
      marginBottom: '0.6875rem',
    },
  },

  resultBody: {
    fontFamily: 'Golos',
    fontWeight: 400,
    fontSize: '0.9375rem',
    lineHeight: '1.5625rem',
    letterSpacing: 0,
    color: customColors.text.dark,
    marginBottom: '1rem',
    overflowWrap: 'anywhere',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1rem',
      lineHeight: '1.625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.5rem',
    },
  },

  resultAction: {
    width: '100%',
    height: '3.125rem',
    borderRadius: '3.5625rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    textAlign: 'center',
    '&:visited': { color: paletteColors.background.default },

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: 1.2,
    letterSpacing: 0,
    textTransform: 'none',
    boxShadow: 'none',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4.375rem',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 'normal',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      height: '3.875rem',
    },
  },
};
