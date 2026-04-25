import { LogOut, Menu, SquareUserRound } from "lucide-react";

import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-ivory transition hover:border-gold/50 hover:bg-white/10"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold">Control Room</p>
            <h2 className="truncate font-display text-lg text-ivory sm:text-xl">Premium property operations</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-gold-2">
              <SquareUserRound className="h-4 w-4" />
            </div>
            <div className="text-right">
              <p className="text-sm text-ivory">{user?.name}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{user?.role}</p>
            </div>
          </div>
          <Button variant="secondary" icon={LogOut} onClick={logout}>
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
