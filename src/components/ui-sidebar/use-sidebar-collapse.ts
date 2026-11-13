import { useEffect, useReducer, useState } from 'react';

import type {
  SidebarCollapse,
  SidebarCollapseEvent,
  SidebarCollapseState,
} from '@/components/types/ui-sidebar';

import SidebarCollapseSource from './sidebar-collapse-source';

function initial(source: SidebarCollapseSource): SidebarCollapseState {
  return { collapsed: source.read(), revealing: false };
}

function next(state: SidebarCollapseState, event: SidebarCollapseEvent): SidebarCollapseState {
  if (event.type === 'animationend') return { ...state, revealing: false };
  return { collapsed: !state.collapsed, revealing: state.collapsed };
}

export default function useSidebarCollapse(): SidebarCollapse {
  const [source] = useState(() => new SidebarCollapseSource());
  const [state, step] = useReducer(next, source, initial);

  useEffect(() => {
    source.write(state.collapsed);
  }, [source, state.collapsed]);

  return { ...state, step };
}
