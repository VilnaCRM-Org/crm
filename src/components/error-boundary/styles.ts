import type { CSSProperties } from 'react';

class ErrorFallbackStyles {
  public build(): Record<string, CSSProperties> {
    return {
      container: this.container(),
      messageBlock: this.messageBlock(),
      heading: this.heading(),
      description: this.description(),
      resetButton: this.resetButton(),
      details: this.details(),
    };
  }

  private container(): CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#FFFFFF',
      color: '#1A1C1E',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
    };
  }

  private messageBlock(): CSSProperties {
    return { textAlign: 'center', maxWidth: '36rem' };
  }

  private heading(): CSSProperties {
    return {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1A1C1E',
      margin: '0 0 1rem',
      outline: 'none',
    };
  }

  private description(): CSSProperties {
    return { fontSize: '1rem', color: '#1A1C1E', margin: '0 0 1.5rem', lineHeight: 1.5 };
  }

  private resetButton(): CSSProperties {
    return {
      marginTop: '1.5rem',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1A1C1E',
      backgroundColor: '#1EAEFF',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      outline: '3px solid #005FCC',
      outlineOffset: '2px',
    };
  }

  private details(): CSSProperties {
    return {
      marginTop: '1.5rem',
      maxWidth: '36rem',
      textAlign: 'left',
      fontSize: '0.875rem',
      color: '#1A1C1E',
    };
  }
}

export default new ErrorFallbackStyles();
