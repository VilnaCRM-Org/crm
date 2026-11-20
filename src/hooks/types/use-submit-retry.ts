import type { RefObject } from 'react';

export interface SubmitRetry {
  readonly submitRef: RefObject<HTMLButtonElement | null>;
  readonly retry: () => void;
}
