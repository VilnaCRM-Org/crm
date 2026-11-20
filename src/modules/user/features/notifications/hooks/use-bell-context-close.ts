import { useState } from 'react';
import { useLocation } from 'react-router';

import type { BellContextCloseOptions } from '../types/bell-disclosure';

export default function useBellContextClose({ layout, close }: BellContextCloseOptions): void {
  const { pathname } = useLocation();
  const [shown, setShown] = useState({ pathname, layout });

  if (shown.pathname !== pathname || shown.layout !== layout) {
    setShown({ pathname, layout });
    close();
  }
}
