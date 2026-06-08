import { Navigate, Outlet } from 'react-router-dom';

import { AuthStoreSelectors, useAuthState } from '@auth/stores';

export default function ProtectedRoute(): JSX.Element {
  const token = AuthStoreSelectors.token(useAuthState());

  return token ? <Outlet /> : <Navigate to="/authentication" replace />;
}
