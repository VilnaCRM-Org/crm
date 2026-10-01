import type { CSSObject } from '@emotion/react';

import type {
  ErrorPageDigitStyleSheet,
  ErrorPageGeometry,
  ErrorPageGlyphPosition,
} from '@/components/types/error-page';

import ERROR_PAGE_GEOMETRY from './error-page-geometry';
import responsiveStyles from './responsive-styles';

export const ERROR_PAGE_DIGIT_SHADOW_VAR = '--error-page-digit-shadow';

class ErrorPageDigitStyles {
  public build(): ErrorPageDigitStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;

    return {
      digits: {
        position: 'relative',
        zIndex: 3,
        flexShrink: 0,
        fontFamily: 'Golos, sans-serif',
        fontWeight: 700,
        letterSpacing: 0,
        '& > span': { position: 'absolute' },
        ...responsiveStyles.compose(this.digits(desktop), this.digits(tablet), this.digits(mobile)),
      },
      glyphs: responsiveStyles.compose(
        this.glyphs(desktop),
        this.glyphs(tablet),
        this.glyphs(mobile)
      ),
    };
  }

  private digits({ digits }: ErrorPageGeometry): CSSObject {
    return {
      width: `${digits.width}px`,
      height: `${digits.height}px`,
      fontSize: `${digits.fontSize}px`,
      lineHeight: `${digits.lineHeight}px`,
      textShadow: `0 ${digits.shadowOffset}px 0 var(${ERROR_PAGE_DIGIT_SHADOW_VAR})`,
    };
  }

  private glyphs({ digits }: ErrorPageGeometry): CSSObject {
    const [first, second, third] = digits.glyphs;

    return {
      '& > span:nth-of-type(1)': this.position(first),
      '& > span:nth-of-type(2)': this.position(second),
      '& > span:nth-of-type(3)': this.position(third),
    };
  }

  private position({ x, y }: ErrorPageGlyphPosition): CSSObject {
    return { left: `${x}px`, top: `${y}px` };
  }
}

export default new ErrorPageDigitStyles();
