import type { CSSObject } from '@emotion/react';

import type {
  ErrorPageBoxGeometry,
  ErrorPageDotStyleSheet,
  ErrorPageGeometry,
} from '@/components/types/error-page';
import { customColors } from '@/styles/colors';

import ERROR_PAGE_GEOMETRY from './error-page-geometry';
import responsiveStyles from './responsive-styles';

class ErrorPageDotStyles {
  public build(): ErrorPageDotStyleSheet {
    const { desktop, tablet, mobile } = ERROR_PAGE_GEOMETRY;
    return {
      dot: {
        zIndex: 5,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: customColors.decorative.dot,
        ...responsiveStyles.compose(this.dot(desktop), this.dot(tablet), this.dot(mobile)),
      },
      dotColumns: {
        zIndex: 5,
        color: customColors.decorative.dotGrid,
        ...responsiveStyles.compose(
          this.dotColumns(desktop),
          this.dotColumns(tablet),
          this.dotColumns(mobile)
        ),
      },
      dotRows: {
        zIndex: 5,
        color: customColors.decorative.dotGrid,
        ...responsiveStyles.compose(
          this.dotRows(desktop),
          this.dotRows(tablet),
          this.dotRows(mobile)
        ),
      },
    };
  }

  private dot({ dot }: ErrorPageGeometry): CSSObject {
    return this.box(dot);
  }

  private dotColumns({ dotColumns }: ErrorPageGeometry): CSSObject {
    return this.box(dotColumns);
  }

  private dotRows({ dotRows }: ErrorPageGeometry): CSSObject {
    return dotRows === null
      ? { display: 'none' }
      : {
          display: 'block',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: `${dotRows.width}px`,
          height: `${dotRows.height}px`,
        };
  }

  private box(box: ErrorPageBoxGeometry | null): CSSObject {
    return box === null
      ? { display: 'none' }
      : {
          display: 'block',
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        };
  }
}

export default new ErrorPageDotStyles();
