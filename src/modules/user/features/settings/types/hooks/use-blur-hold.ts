import type { FocusEvent } from 'react';

export interface BlurHold {
  readonly held: boolean;
  readonly onBlur: (event: FocusEvent<HTMLElement>) => void;
}
