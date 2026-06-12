import { Navigate, Outlet } from 'react-router-dom';

import useAuthToken from '@auth/stores/use-auth-token';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();

  return token ? <Outlet /> : <Navigate to="/authentication" replace />;
}
