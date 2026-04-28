import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "./App";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleBasedRoute from "../components/common/RoleBasedRoute";
import LoaderScreen from "../components/common/LoaderScreen";

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("../features/projects/pages/ProjectsPage"));
const AddProjectPage = lazy(() => import("../features/projects/pages/AddProjectPage"));
const ProjectDetailsPage = lazy(() => import("../features/projects/pages/ProjectDetailsPage"));
const ClientsPage = lazy(() => import("../features/clients/pages/ClientsPage"));
const AddClientPage = lazy(() => import("../features/clients/pages/AddClientPage"));
const FollowupsPage = lazy(() => import("../features/followups/pages/FollowupsPage"));
const SharedHistoryPage = lazy(() => import("../features/share/pages/SharedHistoryPage"));
const SharePreviewPage = lazy(() => import("../features/share/pages/SharePreviewPage"));
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"));

const withSuspense = (element) => <Suspense fallback={<LoaderScreen />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/share-preview/:token", element: withSuspense(<SharePreviewPage />) },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", element: withSuspense(<DashboardPage />) },
          { path: "projects", element: withSuspense(<ProjectsPage />) },
          {
            path: "projects/new",
            element: withSuspense(
              <RoleBasedRoute allowedRoles={["super-admin", "admin", "manager", "marketing"]}>
                <AddProjectPage />
              </RoleBasedRoute>
            ),
          },
          { path: "projects/:id", element: withSuspense(<ProjectDetailsPage />) },
          { path: "clients", element: withSuspense(<ClientsPage />) },
          { path: "clients/new", element: withSuspense(<AddClientPage />) },
          { path: "followups", element: withSuspense(<FollowupsPage />) },
          { path: "shared-history", element: withSuspense(<SharedHistoryPage />) },
          { path: "settings", element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
]);
