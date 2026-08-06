import { useLayoutEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import accessSession from '@/lib/access/access-session';
import useAuthToken from '@auth/stores/use-auth-token';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();

  useLayoutEffect(() => {
    accessSession.sync({ token });
  }, [token]);

  return token ? <Outlet /> : <Navigate to="/sign-in" replace />;
}
