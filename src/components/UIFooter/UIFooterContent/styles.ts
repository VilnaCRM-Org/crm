import breakpointsTheme from '@/components/UIBreakpoints';
import { paletteColors } from '@/styles/colors';
import theme from '@/styles/theme';

const centeredFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const LOGO_DIMENSIONS = {
  base: { width: '8.125rem', height: '2.75rem' },
  lg: { width: '8.6875rem', height: '2.92375rem' },
  xl: { width: '9rem', height: '3rem' },
} as const;

export default {
  footerDesktopWrapper: {
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  },

  footerLogo: {
    ...LOGO_DIMENSIONS.base,

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'block',
      margin: '0 auto 0.9375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      ...LOGO_DIMENSIONS.lg,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      ...LOGO_DIMENSIONS.xl,
    },
  },

  uiInfoWrapper: {
    textAlign: 'center',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'flex',
      alignItems: 'center',
    },
  },

  uiLinkTypography: {
    ...centeredFlex,

    '&:hover, &:focus-visible': {
      color: paletteColors.primary.linkHover,
    },
    '&:visited': {
      color: paletteColors.primary.active,
    },

    '& .MuiTypography-root': {
      fontWeight: 500,
      fontFamily: theme.typography.fontFamily || 'Golos',
      fontSize: '1rem',
      lineHeight: '1.125rem',
      letterSpacing: '0',
    },

    paddingTop: '1.0625rem',
    paddingBottom: '1.125rem',
    marginTop: '0.25rem',

    borderRadius: '8px',
    backgroundColor: paletteColors.background.paper,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxHeight: '2.125rem',
      padding: '0.5rem 1rem',
      marginTop: '0rem',

      '&:last-of-type': {
        marginLeft: '0.5rem',
      },
    },
  },
};
