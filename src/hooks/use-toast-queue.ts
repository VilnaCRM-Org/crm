import { useReducer } from 'react';

import type { ToastDraftSet, ToastItem, ToastQueue } from '@/components/types/ui-toast';

import type { ToastQueueAction, ToastQueueState } from './types/use-toast-queue';

const MAX_TOASTS = 3;

const ALTERNATING_MARK = '​';

const INITIAL_STATE: ToastQueueState = {
  toasts: { items: [] },
  announcement: '',
  nextId: 1,
  marked: false,
};

function reduceToasts(state: ToastQueueState, action: ToastQueueAction): ToastQueueState {
  if (action.type === 'dismiss') {
    return {
      ...state,
      toasts: { items: state.toasts.items.filter((toast) => toast.id !== action.id) },
    };
  }
  const added: ToastItem[] = [];
  const spoken: string[] = [];
  for (const draft of action.drafts.items) {
    added.push({ ...draft, id: state.nextId + added.length });
    if (draft.tone === 'success') spoken.push(draft.message);
  }
  const marked = !state.marked;
  const text = spoken.join(' ');
  return {
    toasts: { items: [...state.toasts.items, ...added].slice(-MAX_TOASTS) },
    announcement: text === '' ? '' : `${text}${marked ? ALTERNATING_MARK : ''}`,
    nextId: state.nextId + added.length,
    marked,
  };
}

export default function useToastQueue(): ToastQueue {
  const [state, dispatch] = useReducer(reduceToasts, INITIAL_STATE);

  return {
    toasts: state.toasts,
    announcement: state.announcement,
    show: (drafts: ToastDraftSet): void => dispatch({ type: 'show', drafts }),
    dismiss: (id: number): void => dispatch({ type: 'dismiss', id }),
  };
}
