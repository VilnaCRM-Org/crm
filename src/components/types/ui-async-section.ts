import type { ReactNode } from 'react';

export type UIAsyncSectionHeading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface UIAsyncSectionProps {
  readonly namespace: string;
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly count: number;
  readonly children: ReactNode;
  readonly headingLevel?: UIAsyncSectionHeading;
}
