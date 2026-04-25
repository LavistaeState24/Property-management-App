import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { navigationItems } from "./navigation";

export const SIDEBAR_WIDTH = "18rem";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname, onClose]);

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 border-r border-white/10 bg-ink/95 px-4 py-5 shadow-glass backdrop-blur-xl transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.4em] text-gold">Lavista</p>
        <h1 className="mt-2 font-display text-2xl text-ivory">Estate CRM</h1>
      </div>
      <nav className="space-y-2">
        {navigationItems.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-gold/20 bg-gradient-to-r from-gold/20 to-transparent text-gold-2"
                    : "text-muted hover:bg-white/5 hover:text-ivory"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
