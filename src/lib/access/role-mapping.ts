import type { Role } from '@/lib/types/access/permission';

import { ROLES } from './permission-catalog';

const SERVER_ROLE_MAP: Readonly<Record<string, Role>> = Object.freeze(
  Object.assign(Object.create(null) as Record<string, Role>, {
    ROLE_USER: ROLES.member,
  })
);

export default SERVER_ROLE_MAP;
