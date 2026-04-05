import { Navigate, Outlet } from 'react-router-dom';

import { useAppSelector } from '@/stores/hooks';

export default function ProtectedRoute(): JSX.Element {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <Outlet /> : <Navigate to="/authentication" replace />;
}
