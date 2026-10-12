import type { CSSObject } from '@emotion/react';

import ERROR_PAGE_GEOMETRY from '@/components/error-page/config/error-page-geometry';
import type {
  ErrorPageGeometry,
  ErrorPageIllustrationStyleSheet,
} from '@/components/types/error-page';
import { customColors, paletteColors } from '@/styles/colors';

import responsiveStyles from './responsive-styles';

class ErrorPageIllustrationStyles {
  public build(): ErrorPageIllustrationStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;
    return {
      layer: this.layer(),
      tab: {
        zIndex: 1,
        backgroundColor: paletteColors.secondary.main,
        ...responsiveStyles.compose(this.tab(desktop), this.tab(tablet), this.tab(mobile)),
      },
      curve: {
        zIndex: 2,
        color: customColors.decorative.curve,
        opacity: 0.3,
        ...responsiveStyles.compose(this.curve(desktop), this.curve(tablet), this.curve(mobile)),
      },
      diamond: {
        zIndex: 5,
        color: customColors.decorative.diamond,
        ...responsiveStyles.compose(
          this.diamond(desktop),
          this.diamond(tablet),
          this.diamond(mobile)
        ),
      },
    };
  }

  private layer(): CSSObject {
    return {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      '& > *': { position: 'absolute' },
    };
  }

  private tab({ tab }: ErrorPageGeometry): CSSObject {
    return {
      left: `${tab.left}px`,
      right: `${tab.right}px`,
      top: `${tab.y}px`,
      height: `${tab.height}px`,
      borderRadius: `${tab.radius}px ${tab.radius}px 0 0`,
    };
  }

  private curve({ curve }: ErrorPageGeometry): CSSObject {
    return {
      left: `${curve.x}px`,
      top: `${curve.y}px`,
      width: `${curve.width}px`,
      height: `${curve.height}px`,
    };
  }

  private diamond({ diamond }: ErrorPageGeometry): CSSObject {
    return {
      left: `${diamond.x}px`,
      top: `${diamond.y}px`,
      width: `${diamond.width}px`,
      height: `${diamond.height}px`,
    };
  }
}

export default new ErrorPageIllustrationStyles();
