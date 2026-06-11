import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { followupService } from "../../services/followupService";

const allowedPaths = ["/followups", "/site-visits", "/profile"];

export default function PendingWorkGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user?.id) return;
    if (user.role !== "sales") return;

    const checkPendingWork = async () => {
      const summary = await followupService.getPendingWorkSummary();

      if (summary.total > 0) {
        const allowed = allowedPaths.some((path) =>
          location.pathname.startsWith(path)
        );

        if (!allowed) {
          navigate("/followups", {
            replace: true,
            state: {
              message:
                "Please complete your pending follow-ups/site visits before continuing.",
            },
          });
        }
      }
    };

    checkPendingWork();
  }, [loading, user?.id, user?.role, location.pathname, navigate]);

  return null;
}