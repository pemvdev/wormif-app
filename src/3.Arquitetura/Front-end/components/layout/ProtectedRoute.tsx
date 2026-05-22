import { Navigate, Outlet } from 'react-router';
import { useApp } from '@Front-end/context/AppContext';

export function ProtectedRoute() {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
