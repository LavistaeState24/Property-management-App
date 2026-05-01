import { Navigate } from "react-router-dom";

import { useCan } from "../../hooks/useCan";

export default function PermissionRoute({ moduleKey, actionKey = "view", children }) {
  const canAccess = useCan(moduleKey, actionKey);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
