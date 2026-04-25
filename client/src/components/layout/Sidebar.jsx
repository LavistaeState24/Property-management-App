import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/projects", label: "Projects" },
  { to: "/projects/new", label: "Add Project" },
  { to: "/clients", label: "Clients" },
  { to: "/clients/new", label: "Add Client" },
  { to: "/followups", label: "Follow-ups" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-gold">Velora</p>
        <h1 className="mt-2 font-display text-2xl text-ivory">Estate CRM</h1>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-gradient-to-r from-gold/20 to-transparent text-gold-2"
                  : "text-muted hover:bg-white/5 hover:text-ivory"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

