import { useLayoutEffect, useRef } from 'react';

import type { ProfileSection } from '../types/user-profile/profile-section';

export default function useCollapseFocus(section: ProfileSection, changed: boolean): void {
  const wasChanged = useRef(false);

  useLayoutEffect(() => {
    if (wasChanged.current && !changed && document.activeElement === document.body) {
      document.getElementById(section)?.focus();
    }
    wasChanged.current = changed;
  }, [changed, section]);
}
