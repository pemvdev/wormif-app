import { Navigate, Outlet, useLocation } from 'react-router';
import { useApp } from '@Front-end/context/AppContext';
import { buildAuthRedirectState } from '@Front-end/utils/authRedirect';

export function AuthRequiredRoute() {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={buildAuthRedirectState(location.pathname)}
      />
    );
  }

  return <Outlet />;
}
