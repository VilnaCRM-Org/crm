import { useEffect, useReducer } from 'react';

import type {
  SidebarCollapse,
  SidebarCollapseEvent,
  SidebarCollapseState,
} from '@/components/types/ui-sidebar';

const STORAGE_KEY = 'crm.sidebar.collapsed';

class SidebarCollapseSource {
  public read(): boolean {
    return this.attempt(() => window.localStorage.getItem(STORAGE_KEY) === 'true', false);
  }

  public write(collapsed: boolean): void {
    this.attempt(() => window.localStorage.setItem(STORAGE_KEY, String(collapsed)), undefined);
  }

  private attempt<T>(action: () => T, fallback: T): T {
    try {
      return action();
    } catch {
      return fallback;
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
