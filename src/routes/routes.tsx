import { createBrowserRouter } from 'react-router-dom';

import registry from './registry';
import routeComposer from './route-composer';

const router = createBrowserRouter(routeComposer.compose(registry));

export default router;
