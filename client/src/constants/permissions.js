export const permissionModules = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projects", label: "Projects" },
  { key: "clients", label: "Clients" },
  { key: "followups", label: "Follow-ups" },
  { key: "siteVisits", label: "Site Visits" },
  { key: "deals", label: "Deal Closing" },
  { key: "shareRecords", label: "Share Records" },
  { key: "users", label: "Users" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

export const permissionActions = ["view", "create", "update", "delete", "scope"];

export const roleOptions = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "sales", label: "Sales Executive" },
];

export const assignableRoleOptions = roleOptions.filter((role) => role.value !== "super-admin");
