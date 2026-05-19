import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "./App";
import DashboardLayout from "../components/layout/DashboardLayout";
import PermissionRoute from "../components/common/PermissionRoute";
import ProtectedRoute from "../components/common/ProtectedRoute";
import LoaderScreen from "../components/common/LoaderScreen";

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("../features/projects/pages/ProjectsPage"));
const AddProjectPage = lazy(() => import("../features/projects/pages/AddProjectPage"));
const ProjectDetailsPage = lazy(() => import("../features/projects/pages/ProjectDetailsPage"));
const ClientsPage = lazy(() => import("../features/clients/pages/ClientsPage"));
const PositiveClientsPage = lazy(() => import("../features/clients/pages/PositiveClientsPage"));
const AddClientPage = lazy(() => import("../features/clients/pages/AddClientPage"));
const ClientDetailsPage = lazy(() => import("../features/clients/pages/ClientDetailsPage"));
const FollowupsPage = lazy(() => import("../features/followups/pages/FollowupsPage"));
const SiteVisitsPage = lazy(() => import("../features/siteVisits/pages/SiteVisitsPage"));
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
          {
            path: "dashboard",
            element: withSuspense(
              <PermissionRoute moduleKey="dashboard">
                <DashboardPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects/new",
            element: withSuspense(
              <PermissionRoute moduleKey="projects" actionKey="create">
                <AddProjectPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="projects" actionKey="update">
                <AddProjectPage />
              </PermissionRoute>
            ),
          },
          {
            path: "projects/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="projects">
                <ProjectDetailsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "clients",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <ClientsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "positive-clients",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <PositiveClientsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "clients/new",
            element: withSuspense(
              <PermissionRoute moduleKey="clients" actionKey="create">
                <AddClientPage />
              </PermissionRoute>
            ),
          },
          {
            path: "clients/:id/edit",
            element: withSuspense(
              <PermissionRoute moduleKey="clients" actionKey="update">
                <AddClientPage />
              </PermissionRoute>
            ),
          },
          {
            path: "clients/:id",
            element: withSuspense(
              <PermissionRoute moduleKey="clients">
                <ClientDetailsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "followups",
            element: withSuspense(
              <PermissionRoute moduleKey="followups">
                <FollowupsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "site-visits",
            element: withSuspense(
              <PermissionRoute moduleKey="siteVisits">
                <SiteVisitsPage />
              </PermissionRoute>
            ),
          },
          {
            path: "shared-history",
            element: withSuspense(
              <PermissionRoute moduleKey="shareRecords">
                <SharedHistoryPage />
              </PermissionRoute>
            ),
          },
          {
            path: "settings",
            element: withSuspense(
              <PermissionRoute moduleKey="settings">
                <SettingsPage />
              </PermissionRoute>
            ),
          },
        ],
      },
    ],
  },
]);
