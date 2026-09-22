import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LoadingState } from './ui/States';

/** Gates a route behind sign-in, and optionally behind a role allow-list. */
export default function ProtectedRoute({ children, roles }) {
  const { status, isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <LoadingState label="Checking your session…" />;
  }

  if (status !== 'signed-in') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="state-panel">
        <h2 className="state-panel__title">Restricted</h2>
        <p className="state-panel__text">
          Your role ({user.role.replace('_', ' ')}) does not have access to this section.
        </p>
      </div>
    );
  }

  return children;
}
