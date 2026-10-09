import authRoutes from '@auth/routes';

import appRoutes from './app-routes';
import type { RouteModuleRegistry } from './types/route-module';

const routeModules: RouteModuleRegistry = { items: [appRoutes, authRoutes] };

export default routeModules;
