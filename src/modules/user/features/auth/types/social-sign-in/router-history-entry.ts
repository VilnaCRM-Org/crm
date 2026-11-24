import type { RedirectNavigationState } from '@/routes/types/navigation-state';

export interface RouterHistoryEntry {
  readonly usr?: RedirectNavigationState | null;
}
