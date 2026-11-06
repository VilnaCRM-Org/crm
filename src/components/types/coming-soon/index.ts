import type { CSSObject } from '@emotion/react';

export interface ComingSoonSection {
  readonly path: string;
  readonly headingKey: string;
}

export interface ComingSoonSectionSet {
  readonly items: readonly ComingSoonSection[];
}

export interface ComingSoonContentProps {
  readonly section: ComingSoonSection;
}

export interface ComingSoonStyleSheet {
  readonly page: CSSObject;
  readonly frame: CSSObject;
}
