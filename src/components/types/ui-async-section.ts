import type { ReactNode } from 'react';

export interface UIAsyncSectionProps {
  readonly namespace: string;
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly count: number;
  readonly children: ReactNode;
}
