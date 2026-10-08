import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

export default {
  authOptionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // The row can carry a second item once the forgotPassword flag is on; wrapping keeps it
    // within a 320px viewport under the WCAG 1.4.12 text-spacing overrides, and the column gap
    // guarantees the 2.5.8 spacing exception the inline link relies on.
    flexWrap: 'wrap',
    columnGap: '1rem',
    rowGap: '0.5rem',
    marginTop: '1rem',
    marginBottom: '0.4375rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.4375rem',
      marginBottom: '-0.5625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '-0.1875rem',
      marginBottom: 0,
    },
  },

  rememberMeLabel: {
    margin: 0,

    '& .MuiFormControlLabel-label': {
      fontFamily: `Inter, sans-serif`,
      fontStyle: 'normal',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.2857',
      letterSpacing: 0,

      color: customColors.text.primary,

      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
        fontSize: '1rem',
        lineHeight: '1.125',
      },
      [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
        fontSize: '0.875rem',
        lineHeight: '1.2857',
      },
    },
  },

  rememberMeCheckbox: {
    padding: 0,
    marginRight: '0.8125rem',
  },

  forgotPasswordLink: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '1.25rem',

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
    letterSpacing: 0,

    // Literal token rather than the MUI theme: `renderWithTheme` replaces the theme instead of
    // merging it, so `theme.palette.primary.main` inside UILink resolves to MUI's default blue.
    color: paletteColors.primary.linkText,

    textDecoration: 'none',
    textDecorationThickness: '2px',
    textUnderlineOffset: '0.2em',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      minHeight: '1.5rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '1.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: '1.125rem',
    },

    '&:hover': {
      color: paletteColors.primary.linkTextHover,
      textDecoration: 'underline',
    },

    '&:focus-visible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
      borderRadius: '2px',
      textDecoration: 'underline',
    },
  },
};
