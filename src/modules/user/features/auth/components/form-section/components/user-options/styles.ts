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

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '0.8125rem',
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
    minHeight: '1.5rem',

    fontFamily: `Inter, sans-serif`,
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.2857',

    // Literal token rather than the MUI theme: `renderWithTheme` replaces the theme instead of
    // merging it, so `theme.palette.primary.main` inside UILink resolves to MUI's default blue.
    color: paletteColors.primary.linkText,

    // The underline must live here: ui-link/theme.ts sets `textDecoration: 'none'` in
    // `styleOverrides.root`, which outranks the `underline` prop. Without it the link is
    // distinguished from the adjacent label by colour alone (WCAG 1.4.1).
    textDecoration: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.2em',

    '&:hover': {
      color: paletteColors.primary.linkTextHover,
      textDecorationThickness: '2px',
    },

    '&:focus-visible': {
      outline: `2px solid ${customColors.text.primary}`,
      outlineOffset: '2px',
      borderRadius: '2px',
      textDecorationThickness: '2px',
    },
  },
};
