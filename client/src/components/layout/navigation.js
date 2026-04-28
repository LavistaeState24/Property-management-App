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
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/projects/new", label: "Add Project", icon: FolderPlus },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/clients/new", label: "Add Client", icon: UserPlus },
  { to: "/followups", label: "Follow-ups", icon: BriefcaseBusiness },
  { to: "/shared-history", label: "Shared History", icon: MessageSquareShare },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const profileIcon = SquareUserRound;
