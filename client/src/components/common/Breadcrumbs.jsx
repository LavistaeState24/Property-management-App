import { Link, useLocation, useNavigation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const labelMap = {
  dashboard: "Dashboard",
  projects: "Projects",
  clients: "Clients",
  leads: "Leads",
  followups: "Follow-ups",
  reminders: "Reminders",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  add: "Add",
  edit: "Edit",
  details: "Details",
};

const formatLabel = (value) => {
  if (!value) return "";
  if (labelMap[value]) return labelMap[value];

  if (value.length > 16) return "Details";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Breadcrumbs() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigation = useNavigation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const isLoading = navigation.state !== "idle";

  if (pathnames.length === 0) return null;

  if (isLoading) {
    return (
      <nav
        aria-label="breadcrumb"
        className="mb-4 flex items-center rounded-2xl border border-border bg-surface px-4 py-3 shadow-glass"
      >
        <div className="h-4 w-16 animate-pulse rounded-full bg-border" />
        <ChevronRight className="mx-2 h-4 w-4 text-subtle" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-border" />
        <ChevronRight className="mx-2 h-4 w-4 text-subtle" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-border" />
      </nav>
    );
  }

  const getBreadcrumbTarget = (routeTo) => {
    if (routeTo === "/projects") {
      return searchParams.get("returnTo") || "/projects";
    }

    return routeTo;
  };

  return (
    <nav
      aria-label="breadcrumb"
      className="mb-4 flex items-center rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-body shadow-glass"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-3 text-body transition hover:text-gold"
      >
        <Home className="h-4 w-4 text-gold" />
        Dashboard
      </Link>

      {pathnames.map((name, index) => {
        if (name === "dashboard") return null;

        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={routeTo} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4 text-subtle" />

            {isLast ? (
              <span className="font-semibold text-heading">
                {formatLabel(name)}
              </span>
            ) : (
              <Link
                to={getBreadcrumbTarget(routeTo)}
                className="text-body transition hover:text-gold"
              >
                {formatLabel(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}