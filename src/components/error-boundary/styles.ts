import type { CSSObject } from '@emotion/react';

import type { ErrorFallbackStyleSheet } from '@/components/types/error-boundary';
import { customColors, paletteColors } from '@/styles/colors';

class ErrorFallbackStyles {
  public build(): ErrorFallbackStyleSheet {
    return {
      container: this.container(),
      messageBlock: this.messageBlock(),
      heading: this.heading(),
      description: this.description(),
      actions: this.actions(),
      button: this.button(),
      link: this.link(),
      details: this.details(),
    };
  }

  private container(): CSSObject {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '1 1 auto',
      padding: '2rem',
      backgroundColor: paletteColors.background.default,
      color: customColors.text.dark,
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
    };
  }

  private messageBlock(): CSSObject {
    return { textAlign: 'center', maxWidth: '36rem' };
  }

  private heading(): CSSObject {
    return {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: customColors.text.dark,
      margin: '0 0 1rem',
      '&:focus:not(:focus-visible)': { outline: 'none' },
      '&:focus-visible': { outline: '3px solid #005FCC', outlineOffset: '2px' },
    };
  }

  private description(): CSSObject {
    return {
      fontSize: '1rem',
      color: customColors.text.dark,
      margin: '0 0 1.5rem',
      lineHeight: 1.5,
    };
  }

  private actions(): CSSObject {
    return {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
    };
  }

  private action(): CSSObject {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '2.75rem',
      lineHeight: 1.5,
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      borderRadius: '8px',
      textDecoration: 'none',
      boxSizing: 'border-box',
      '&:focus-visible': { outline: '3px solid #005FCC', outlineOffset: '2px' },
      '@media (forced-colors: active)': { border: '1px solid ButtonText' },
    };
  }

  private button(): CSSObject {
    return {
      ...this.action(),
      color: customColors.text.dark,
      backgroundColor: paletteColors.primary.main,
      border: 'none',
      cursor: 'pointer',
    };
  }

  private link(): CSSObject {
    return {
      ...this.action(),
      color: paletteColors.primary.linkText,
      backgroundColor: paletteColors.background.default,
      border: '2px solid currentColor',
    };
  }

  private details(): CSSObject {
    return {
      marginTop: '1.5rem',
      maxWidth: '36rem',
      textAlign: 'left',
      fontSize: '0.875rem',
      color: customColors.text.dark,
      '& pre': { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
    };
  }
}

export default new ErrorFallbackStyles();
