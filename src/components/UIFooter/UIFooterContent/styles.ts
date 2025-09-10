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
    [breakpointsTheme.breakpoints.up('md')]: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  },

  footerLogo: {
    ...LOGO_DIMENSIONS.base,

    [breakpointsTheme.breakpoints.down('md')]: {
      display: 'block',
      margin: '0 auto 0.9375rem',
    },
    [breakpointsTheme.breakpoints.up('lg')]: {
      ...LOGO_DIMENSIONS.lg,
    },
    [breakpointsTheme.breakpoints.up('xl')]: {
      ...LOGO_DIMENSIONS.xl,
    },
  },

  uiInfoWrapper: {
    textAlign: 'center',

    [breakpointsTheme.breakpoints.up('md')]: {
      display: 'flex',
      alignItems: 'center',
    },
  },

  uiLinkTypography: {
    ...centeredFlex,

    '&:hover': {
      color: paletteColors.primary.linkHover,
    },
    '&:focus-visible': {
      color: paletteColors.primary.linkHover,
      outline: `2px solid ${paletteColors.primary.main}`,
      outlineOffset: '2px',
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

    [breakpointsTheme.breakpoints.up('md')]: {
      maxHeight: '2.125rem',
      padding: '0.5rem 1rem',
      marginTop: '0rem',

      '&:not(:first-of-type)': {
        marginLeft: '0.5rem',
      },
    },
  },
};
