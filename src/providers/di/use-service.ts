import { useMemo } from 'react';
import type { InjectionToken } from 'tsyringe';

import container from '@/config/dependency-injection-config';

export default function useService<T>(token: InjectionToken<T>): T {
  return useMemo(() => container.resolve<T>(token), [token]);
}
