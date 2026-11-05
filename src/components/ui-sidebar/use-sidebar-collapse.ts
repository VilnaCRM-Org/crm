import { useReducer } from 'react';

import type {
  SidebarCollapse,
  SidebarCollapseEvent,
  SidebarCollapseState,
} from '@/components/types/ui-sidebar';

const INITIAL: SidebarCollapseState = { collapsed: false, revealing: false };

function next(state: SidebarCollapseState, event: SidebarCollapseEvent): SidebarCollapseState {
  if (event.type === 'animationend') return { ...state, revealing: false };
  return { collapsed: !state.collapsed, revealing: state.collapsed };
}

export default function useSidebarCollapse(): SidebarCollapse {
  const [state, step] = useReducer(next, INITIAL);
  return { ...state, step };
}
