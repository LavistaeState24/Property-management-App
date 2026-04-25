import { Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

export default function RoleBasedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

