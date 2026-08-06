import { createContext } from 'react';

import type { AccessSnapshot } from '@/lib/types/access/principal';

const AccessContext = createContext<AccessSnapshot | null>(null);

export default AccessContext;
