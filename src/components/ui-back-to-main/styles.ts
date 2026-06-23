import { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import breakpointsTheme from '@/components/ui-breakpoints';

const lgUp = `@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`;

class BackToMainStyles {
  public build(theme: Theme): Record<string, SxProps<Theme>> {
    return {
      section: this.section(theme),
      backButton: this.backButton(theme),
      icon: this.icon(theme),
      backText: this.backText(theme),
    };
  }

  private section(theme: Theme): SxProps<Theme> {
    return {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      backgroundColor: theme.palette.background.default,
      [lgUp]: {
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
      },
    };
  }

  private backButton(theme: Theme): SxProps<Theme> {
    return {
      padding: 0,
      '&:hover': { backgroundColor: 'transparent' },
      '&:focus-visible': {
        backgroundColor: 'transparent',
        outline: theme.palette.primary.main
          ? `2px solid ${theme.palette.primary.main}`
          : '2px solid #1976d2',
        outlineOffset: '2px',
      },
    };
  }

  private icon(theme: Theme): SxProps<Theme> {
    return {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: theme.palette.grey[50],
      width: '24px',
      height: '24px',
    };
  }

  private backText(theme: Theme): SxProps<Theme> {
    return {
      marginLeft: theme.spacing(1),
      fontFamily: theme.typography.fontFamily,
      fontWeight: 500,
      fontSize: theme.typography.pxToRem(15),
      lineHeight: theme.typography.pxToRem(18),
      textTransform: 'none',
      color: theme.palette.grey[50],
      [lgUp]: {
        lineHeight: '1.125rem',
        letterSpacing: 0,
      },
    };
  }
}

export default new BackToMainStyles();
