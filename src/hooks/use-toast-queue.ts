import { useReducer } from 'react';

import type { ToastDraftSet, ToastItem, ToastQueue, ToastTone } from '@/components/types/ui-toast';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import type { ToastQueueAction, ToastQueueState } from './types/use-toast-queue';

const MAX_TOASTS = 3;

const INITIAL_STATE: ToastQueueState = {
  toasts: { items: [] },
  announcement: '',
  alert: '',
  nextId: 1,
  marked: false,
};

function spokenText(drafts: ToastDraftSet, tone: ToastTone, marked: boolean): string {
  const text = drafts.items
    .filter((draft) => draft.tone === tone)
    .map((draft) => draft.message)
    .join(' ');
  return text === '' ? '' : `${text}${marked ? ALTERNATING_MARK : ''}`;
}

function showToasts(state: ToastQueueState, drafts: ToastDraftSet): ToastQueueState {
  const added: ToastItem[] = drafts.items.map((draft, index) => ({
    ...draft,
    id: state.nextId + index,
  }));
  const marked = !state.marked;
  return {
    toasts: { items: [...state.toasts.items, ...added].slice(-MAX_TOASTS) },
    announcement: spokenText(drafts, 'success', marked),
    alert: spokenText(drafts, 'error', marked),
    nextId: state.nextId + added.length,
    marked,
  };
}

function reduceToasts(state: ToastQueueState, action: ToastQueueAction): ToastQueueState {
  if (action.type === 'show') return showToasts(state, action.drafts);
  return {
    ...state,
    toasts: { items: state.toasts.items.filter((toast) => toast.id !== action.id) },
  };
}

export default function useToastQueue(): ToastQueue {
  const [state, dispatch] = useReducer(reduceToasts, INITIAL_STATE);

  return {
    toasts: state.toasts,
    announcement: state.announcement,
    alert: state.alert,
    show: (drafts: ToastDraftSet): void => dispatch({ type: 'show', drafts }),
    dismiss: (id: number): void => dispatch({ type: 'dismiss', id }),
  };
}
