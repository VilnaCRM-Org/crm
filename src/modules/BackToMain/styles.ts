import { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import breakpointsTheme from '@/components/UIBreakpoints';

const getBackToMainStyles = (theme: Theme): Record<string, SxProps<Theme>> => ({
  section: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),

    backgroundColor: theme.palette.background.default,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      paddingTop: '1.25rem',
      paddingBottom: '1.25rem',
    },
  },
  backButton: {
    padding: 0,

    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:focus-visible': {
      backgroundColor: 'transparent',
      outline: theme.palette.primary.main
        ? `2px solid ${theme.palette.primary.main}`
        : '2px solid #1976d2',
      outlineOffset: '2px',
    },
  },

  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    color: theme.palette.grey[50],
    width: '24px',
    height: '24px',
  },

  backText: {
    marginLeft: theme.spacing(1),

    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    fontSize: theme.typography.pxToRem(15),
    lineHeight: theme.typography.pxToRem(18),
    textTransform: 'none',

    color: theme.palette.grey[50],

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      lineHeight: '1.125rem',
      letterSpacing: 0,
    },
  },
});
export default getBackToMainStyles;
