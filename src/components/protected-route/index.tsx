import { Navigate, Outlet } from 'react-router-dom';

import { selectToken, useAuthStore } from '@/stores/auth-store';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthStore(selectToken);
  return token ? <Outlet /> : <Navigate to="/authentication" replace />;
}
