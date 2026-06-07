import { Navigate, Outlet } from 'react-router-dom';

import { AuthStoreSelectors, useAuthStore } from '@auth/stores';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthStore(AuthStoreSelectors.token);

  return token ? <Outlet /> : <Navigate to="/authentication" replace />;
}
