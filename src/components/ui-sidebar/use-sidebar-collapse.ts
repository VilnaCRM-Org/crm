import { useEffect, useReducer } from 'react';

import type {
  SidebarCollapse,
  SidebarCollapseEvent,
  SidebarCollapseState,
} from '@/components/types/ui-sidebar';

const STORAGE_KEY = 'crm.sidebar.collapsed';

class SidebarCollapseSource {
  public read(): boolean {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public write(collapsed: boolean): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      return;
    }
  }
}

const sidebarCollapseSource = new SidebarCollapseSource();

function initial(): SidebarCollapseState {
  return { collapsed: sidebarCollapseSource.read(), revealing: false };
}

function next(state: SidebarCollapseState, event: SidebarCollapseEvent): SidebarCollapseState {
  if (event.type === 'animationend') return { ...state, revealing: false };
  return { collapsed: !state.collapsed, revealing: state.collapsed };
}

export default function useSidebarCollapse(): SidebarCollapse {
  const [state, step] = useReducer(next, undefined, initial);

  useEffect(() => {
    sidebarCollapseSource.write(state.collapsed);
  }, [state.collapsed]);

  return { ...state, step };
}
