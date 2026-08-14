import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthToken from '@auth/stores/use-auth-token';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();
  const location = useLocation();

  return token ? <Outlet /> : <Navigate to="/sign-in" replace state={{ from: location }} />;
}
