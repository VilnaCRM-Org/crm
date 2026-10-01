import type { CSSObject } from '@emotion/react';

import type { ErrorPageCardStyleSheet, ErrorPageGeometry } from '@/components/types/error-page';
import { customColors, paletteColors } from '@/styles/colors';

import ERROR_PAGE_GEOMETRY from './error-page-geometry';
import responsiveStyles from './responsive-styles';

const ROOT_FONT_SIZE = 16;

const CENTRED_TEXT: CSSObject = {
  fontFamily: 'Golos, sans-serif',
  letterSpacing: 0,
  textAlign: 'center',
};

const VISUALLY_HIDDEN: CSSObject = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

class ErrorPageCardStyles {
  public build(): ErrorPageCardStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;

    return {
      card: {
        ...this.surface(),
        ...responsiveStyles.compose(this.card(desktop), this.card(tablet), this.card(mobile)),
      },
      title: {
        ...CENTRED_TEXT,
        margin: 0,
        color: customColors.text.heading,
        '&:focus': { outline: 'none' },
        ...responsiveStyles.compose(this.title(desktop), this.title(tablet), this.title(mobile)),
      },
      description: {
        ...CENTRED_TEXT,
        fontWeight: 400,
        color: customColors.text.dark,
        ...responsiveStyles.compose(
          this.description(desktop),
          this.description(tablet),
          this.description(mobile)
        ),
      },
      statusCode: VISUALLY_HIDDEN,
    };
  }

  private surface(): CSSObject {
    return {
      position: 'relative',
      zIndex: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: paletteColors.background.default,
      borderStyle: 'solid',
      borderColor: paletteColors.border.default,
    };
  }

  private card({ card }: ErrorPageGeometry): CSSObject {
    const { border, radius, shadowY, shadowBlur, top, bottom } = card;

    return {
      borderWidth: `${border}px`,
      borderRadius: `${radius}px`,
      boxShadow: `0 ${shadowY}px ${shadowBlur}px 0 ${customColors.shadow.card}`,
      padding: `${top - border}px 0 ${bottom - border}px`,
    };
  }

  private title({ card }: ErrorPageGeometry): CSSObject {
    return {
      maxWidth: `calc(100% - ${card.textInset * 2}px)`,
      fontSize: `${card.titleSize / ROOT_FONT_SIZE}rem`,
      lineHeight: `${card.titleLine / ROOT_FONT_SIZE}rem`,
      fontWeight: card.titleWeight,
    };
  }

  private description({ card }: ErrorPageGeometry): CSSObject {
    return {
      maxWidth: `calc(100% - ${card.textInset * 2}px)`,
      margin: `${card.gapTitle}px 0 ${card.gapActions}px`,
      fontSize: `${card.descSize / ROOT_FONT_SIZE}rem`,
      lineHeight: `${card.descLine / ROOT_FONT_SIZE}rem`,
    };
  }
}

export default new ErrorPageCardStyles();
