import authRoutes from '@auth/routes';

import appRoutes from './app-routes';
import type { RouteModule } from './types/route-module';

const routeModules: readonly RouteModule[] = [appRoutes, authRoutes];

export default routeModules;
