import type { RefCallback } from 'react';

export interface ChipNameGrowth {
  readonly grow: number;
  readonly sizers: RefCallback<HTMLElement>;
}
