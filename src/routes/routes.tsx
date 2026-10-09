import { createBrowserRouter } from 'react-router';

import registry from './registry';
import routeComposer from './route-composer';

const router = createBrowserRouter(routeComposer.compose(registry).items);

export const onRouteError = routeComposer.routeErrorHandler();

export default router;
