import { Navigate } from 'react-router';
import { useApp } from '@Front-end/context/AppContext';

export function RootRedirect() {
  const { user } = useApp();
  return <Navigate to={user ? '/upload' : '/login'} replace />;
}
