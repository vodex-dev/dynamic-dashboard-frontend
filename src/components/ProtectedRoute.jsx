import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect based on user role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'user') {
      return <Navigate to="/user/overview" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

