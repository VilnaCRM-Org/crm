export type LiveStatusPoliteness = 'polite' | 'assertive';

export interface UILiveStatusProps {
  message: string;
  politeness?: LiveStatusPoliteness | undefined;
}
