import type { CSSObject } from '@emotion/react';

import ERROR_PAGE_MEDIA from './error-page-media';

class ErrorPageResponsiveStyles {
  public compose(desktop: CSSObject, tablet: CSSObject, mobile: CSSObject): CSSObject {
    return {
      ...desktop,
      [ERROR_PAGE_MEDIA.tablet]: tablet,
      [ERROR_PAGE_MEDIA.mobile]: mobile,
    };
  }
}

export default new ErrorPageResponsiveStyles();
