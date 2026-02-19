import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const MOBILE_NOTIFICATION_HEIGHT = 'max(400px, calc(100dvh + 1rem))';

export default {
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '0.5rem',
    paddingX: '0.375rem',
    paddingBottom: '1.5rem',

    fontFamily: 'Golos',
    backgroundColor: '#FBFBFB',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '8.4375rem',
      paddingBottom: '8.4375rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      paddingTop: '3.4375rem',
      paddingBottom: '3.4375rem',
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

    maxWidth: '22.6875rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth: '39.5rem',

      paddingTop: '2.625rem ',
      paddingLeft: '2.8125rem',
      paddingRight: '2.8125rem',
      paddingBottom: '2.1875rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxWidth: '31.375rem',
      padding: '2.1rem 2.4375rem 1.9375rem',
    },
  },
  formWrapperWithNotification: {
    '&&': {
      overflow: 'hidden',
      '@media (max-width: 374px)': {
        height: MOBILE_NOTIFICATION_HEIGHT,
        minHeight: MOBILE_NOTIFICATION_HEIGHT,
      },
    },
  },

  hiddenElement: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  formSwitcherButton: {
    display: 'block',
    padding: 0,
    margin: '1.4375rem auto 0',

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: customColors.text.secondary,
    textTransform: 'none',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      margin: '2.75rem auto 0',

      fontSize: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      margin: '1.5rem auto 0',

      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
    },
  },
};
