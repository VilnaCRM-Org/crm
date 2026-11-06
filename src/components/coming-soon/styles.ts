import type { CSSObject } from '@emotion/react';

import ERROR_PAGE_GEOMETRY from '@/components/error-page/config/error-page-geometry';
import responsiveStyles from '@/components/error-page/styles/responsive-styles';
import type { ComingSoonStyleSheet } from '@/components/types/coming-soon';
import type { ErrorPageGeometry } from '@/components/types/error-page';
import { customColors } from '@/styles/colors';

class ComingSoonStyles {
  public build(): ComingSoonStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;

    return {
      page: {
        ...this.surface(),
        ...responsiveStyles.compose(this.page(desktop), this.page(tablet), this.page(mobile)),
      },
      frame: {
        maxWidth: 'calc(100% - 24.6px)',
        ...responsiveStyles.compose(this.frame(desktop), this.frame(tablet), this.frame(mobile)),
      },
    };
  }

  private surface(): CSSObject {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: '1 0 auto',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: customColors.surface.page,
    };
  }

  private page({ page }: ErrorPageGeometry): CSSObject {
    return { paddingTop: `${page.paddingTop}px`, paddingBottom: `${page.paddingBottom}px` };
  }

  private frame({ composition }: ErrorPageGeometry): CSSObject {
    return { width: `${composition.width}px` };
  }
}

export default new ComingSoonStyles();
