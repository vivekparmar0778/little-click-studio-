
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ allowedRole }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-route-loading" aria-live="polite">
        <p>Checking your secure session…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRole === "customer" && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Unknown roles must not be granted dashboard access.
  if (
    allowedRole === "customer" &&
    user?.role !== "customer" &&
    user?.is_staff !== false
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
