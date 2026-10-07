import type { CSSObject } from '@emotion/react';

import type { ErrorPageGeometry, ErrorPageStyleSheet } from '@/components/types/error-page';
import { customColors } from '@/styles/colors';

import ERROR_PAGE_GEOMETRY from './error-page-geometry';
import responsiveStyles from './responsive-styles';

class ErrorPageStyles {
  public build(): ErrorPageStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;

    return {
      landmark: {
        ...this.surface(),
        ...responsiveStyles.compose(
          this.landmark(desktop),
          this.landmark(tablet),
          this.landmark(mobile)
        ),
      },
      composition: {
        ...this.frame(),
        ...responsiveStyles.compose(
          this.composition(desktop),
          this.composition(tablet),
          this.composition(mobile)
        ),
      },
    };
  }

  private surface(): CSSObject {
    return {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 0 auto',
      overflowX: 'clip',
      backgroundColor: customColors.surface.page,
    };
  }

  private frame(): CSSObject {
    return {
      position: 'relative',
      isolation: 'isolate',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: 'calc(100% - 24.6px)',
      marginInline: 'auto',
    };
  }

  private landmark({ page }: ErrorPageGeometry): CSSObject {
    return { paddingTop: `${page.paddingTop}px`, paddingBottom: `${page.paddingBottom}px` };
  }

  private composition({ composition, dotRows }: ErrorPageGeometry): CSSObject {
    const decorationBelow = dotRows === null ? 0 : dotRows.gapBelowCard + dotRows.height;

    return { width: `${composition.width}px`, paddingBottom: `${decorationBelow}px` };
  }
}

export default new ErrorPageStyles();
