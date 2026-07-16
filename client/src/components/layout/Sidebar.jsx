import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";
import { usePermissions } from "../../hooks/usePermissions";

export const SIDEBAR_WIDTH = "18rem";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const permissions = usePermissions();

  const visibleItems = navigationItems.filter((link) => {
    if (!link.moduleKey || !link.actionKey) {
      return true;
    }

    return Boolean(permissions?.[link.moduleKey]?.[link.actionKey]);
  });

  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <aside
      className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col overflow-y-auto
      border-r border-white/10 bg-[#192231] px-4 py-5
      shadow-[8px_0_30px_rgba(15,23,42,0.16)]
      transition-transform duration-300 ease-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Brand */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
        <p className="font-display text-lg leading-none text-[#f3d79b]">
          Lavista
        </p>

        <p className="mt-1 text-xs tracking-wide text-white/55">
          Property Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {visibleItems.map((link, index) => {
          const Icon = link.icon;
          const previousGroup = visibleItems[index - 1]?.group;

          const shouldRenderGroup =
            link.group && link.group !== previousGroup;

          return (
            <div key={link.to} className="space-y-2">
              {shouldRenderGroup ? (
                <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a35d]">
                  {link.group}
                </p>
              ) : null}

              <NavLink
                to={link.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border-[#c9a35d]/30 bg-gradient-to-r from-[#c9a35d]/25 to-[#c9a35d]/5 text-[#f3d79b] shadow-[0_8px_24px_rgba(201,163,93,0.12)]"
                      : "border-transparent text-white/65 hover:bg-white/[0.06] hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />

                <span className="truncate">
                  {link.label}
                </span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Bottom Card */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-sm font-semibold text-white">
          CRM System
        </p>

        <p className="mt-1 text-xs leading-5 text-white/50">
          Manage projects, clients, follow-ups and property leads.
        </p>
      </div>
    </aside>
  );
}