import { Navigate, Outlet, useLocation } from 'react-router';
import { useApp } from '@Front-end/context/AppContext';

export function AuthRequiredRoute() {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
