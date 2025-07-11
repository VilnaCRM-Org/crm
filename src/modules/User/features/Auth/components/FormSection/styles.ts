import breakpointsTheme from '@/components/UIBreakpoints';
import { paletteColors, customColors } from '@/styles/colors';

export default {
  formSection: {
    paddingTop: '0.5rem',
    paddingX: '0.375rem',
    paddingBottom: '1.5rem',
    fontFamily: 'Golos',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '8.4375rem',
      paddingBottom: '22.8125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      paddingTop: '5.25rem',
      paddingBottom: '5.25rem',
    },
  },
  formWrapper: {
    position: 'relative',
    width: '100%',
    padding: '1.5rem 1.5rem 1.375rem',
    margin: '0 auto',

    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.border.default}`,
    borderRadius: '16px',
    boxShadow: `0px 7px 40px 0px ${paletteColors.shadow.subtle}`,

    maxWidth: '22.7rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      padding: '2rem 2.5rem 2.875rem',
      maxWidth: '39.5rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      padding: '2rem 2.5rem 2.0625rem',
      maxWidth: '31.375rem',
    },
  },

  formSwitcherButton: {
    display: 'block',
    margin: '1.4375rem auto 0',

    fontWeight: 500,
    fontSize: '0.9375rem',
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: customColors.text.secondary,
    textTransform: 'none',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      margin: '2.75rem auto 0',

      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      margin: '1.265rem auto 0',

      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
    },
  },
};
