import {
  BriefcaseBusiness,
  Building2,
  FolderPlus,
  LayoutDashboard,
  MessageSquareShare,
  Settings,
  SquareUserRound,
  UserPlus,
  Users,
} from "lucide-react";

export const navigationItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, moduleKey: "dashboard", actionKey: "view" },
  { to: "/projects", label: "Projects", icon: Building2, moduleKey: "projects", actionKey: "view" },
  { to: "/projects/new", label: "Add Project", icon: FolderPlus, moduleKey: "projects", actionKey: "create" },
  { to: "/clients", label: "Leads", icon: Users, moduleKey: "clients", actionKey: "view" },
  { to: "/clients/new", label: "Add Lead", icon: UserPlus, moduleKey: "clients", actionKey: "create" },
  { to: "/followups", label: "Follow-ups", icon: BriefcaseBusiness, moduleKey: "followups", actionKey: "view" },
  { to: "/shared-history", label: "Shared History", icon: MessageSquareShare, moduleKey: "shareRecords", actionKey: "view" },
  { to: "/settings", label: "Settings", icon: Settings, moduleKey: "settings", actionKey: "view" },
];

export const profileIcon = SquareUserRound;
