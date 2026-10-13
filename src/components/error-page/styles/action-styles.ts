import type { CSSObject } from '@emotion/react';
import { touchRippleClasses } from '@mui/material/ButtonBase';

import ERROR_PAGE_GEOMETRY from '@/components/error-page/config/error-page-geometry';
import ERROR_PAGE_MEDIA from '@/components/error-page/config/error-page-media';
import type { ErrorPageActionStyleSheet, ErrorPageGeometry } from '@/components/types/error-page';
import UI_BUTTON_PHONE_MEDIA from '@/components/ui-button/phone-media';
import { customColors, paletteColors } from '@/styles/colors';

import responsiveStyles from './responsive-styles';

const OUTLINED_BORDER_WIDTH = 1;
const ROOT_FONT_SIZE = 16;
const STACK_GAP = 6;
const STACK_INSET = 20;

class ErrorPageActionStyles {
  public build(): ErrorPageActionStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;

    return {
      row: this.row(),
      contained: {
        ...this.containedSurface(),
        ...responsiveStyles.compose(
          this.contained(desktop),
          this.contained(tablet),
          this.contained(mobile)
        ),
      },
      outlined: {
        ...this.outlinedSurface(),
        ...responsiveStyles.compose(
          this.outlined(desktop),
          this.outlined(tablet),
          this.outlined(mobile)
        ),
        [UI_BUTTON_PHONE_MEDIA]: { ...this.outlined(mobile), marginBottom: 0 },
      },
      stacked: { [ERROR_PAGE_MEDIA.mobile]: { width: '100%' } },
    };
  }

  private row(): CSSObject {
    return {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      paddingInline: '4px',
      boxSizing: 'border-box',
      [ERROR_PAGE_MEDIA.mobile]: {
        flexDirection: 'column',
        gap: `${STACK_GAP}px`,
        paddingInline: `${STACK_INSET - ERROR_PAGE_GEOMETRY.mobile.card.border}px`,
      },
    };
  }

  private base(): CSSObject {
    return {
      fontFamily: 'Golos, sans-serif',
      textTransform: 'none',
      letterSpacing: 0,
      borderRadius: '57px',
      boxShadow: 'none',
      maxWidth: '100%',
      boxSizing: 'border-box',
      '&:focus-visible': {
        outline: `2px solid ${customColors.text.dark}`,
        outlineOffset: '2px',
      },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        [`& .${touchRippleClasses.root}`]: { display: 'none' },
      },
    };
  }

  private label(color: string): CSSObject {
    return { color, '&:visited': { color } };
  }

  private containedSurface(): CSSObject {
    return { ...this.base(), ...this.label(paletteColors.background.default) };
  }

  private outlinedSurface(): CSSObject {
    return {
      ...this.base(),
      backgroundColor: paletteColors.background.default,
      border: `${OUTLINED_BORDER_WIDTH}px solid ${paletteColors.grey[50]}`,
      ...this.label(customColors.brand.darkPrimary),
      '&:hover': {
        backgroundColor: paletteColors.background.default,
        borderColor: paletteColors.grey[50],
      },
    };
  }

  private contained(geometry: ErrorPageGeometry): CSSObject {
    const { height, paddingX, labelSize, labelLine, labelWeight } = geometry.button;

    return {
      minHeight: `${height}px`,
      padding: `${(height - labelLine) / 2}px ${paddingX}px`,
      fontSize: `${labelSize / ROOT_FONT_SIZE}rem`,
      lineHeight: `${labelLine / ROOT_FONT_SIZE}rem`,
      fontWeight: labelWeight,
    };
  }

  private outlined(geometry: ErrorPageGeometry): CSSObject {
    const { height, paddingX, labelLine } = geometry.button;
    const paddingY = (height - labelLine) / 2 - OUTLINED_BORDER_WIDTH;

    return {
      ...this.contained(geometry),
      padding: `${paddingY}px ${paddingX - OUTLINED_BORDER_WIDTH}px`,
    };
  }
}

export default new ErrorPageActionStyles();
