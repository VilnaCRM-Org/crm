import type { Role } from '@/lib/types/access/permission';

import { ROLES } from './permission-catalog';

// Interim mapping (architecture D2, OQ-3): the server keeps its `ROLE_*` vocabulary, so the
// client translates it in one reviewed, data-only place. `ROLE_SERVICE` is deliberately absent
// — a service token has no business rendering a browser UI (OQ-12) — so it falls through to
// the unmapped-role rule in `SessionFactory` exactly like any other name the map does not know.
const SERVER_ROLE_MAP: Readonly<Record<string, Role>> = Object.freeze({
  ROLE_USER: ROLES.member,
});

export { SERVER_ROLE_MAP };
