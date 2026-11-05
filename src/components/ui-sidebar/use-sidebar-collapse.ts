import { useCallback, useState } from 'react';

import type { SidebarCollapse } from '@/components/types/ui-sidebar';

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

export default function useSidebarCollapse(): SidebarCollapse {
  const [collapsed, setCollapsed] = useState(() => sidebarCollapseSource.read());

  const flip = useCallback((): void => {
    setCollapsed((current) => {
      sidebarCollapseSource.write(!current);
      return !current;
    });
  }, []);

  return { collapsed, flip };
}
