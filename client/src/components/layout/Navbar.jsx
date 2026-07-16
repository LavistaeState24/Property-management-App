import { useState } from "react";
import { LogOut, Menu, SquareUserRound, Mail, Clock, ShieldCheck } from "lucide-react";
import Button from "../common/Button";
import Logo from "../../assets/Logo.png";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isOnline =
    user?.lastSeenAt &&
    Date.now() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000;

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }) : "Never";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-[#192231] shadow-lg">
  <div className="mx-auto flex h-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-5">

    {/* Left */}
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all duration-200 hover:border-[#c9a35d]/50 hover:bg-white/10"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu className="h-5 w-5" />
      </button>

      <img
        src={Logo}
        className="h-9 w-auto shrink-0 object-contain sm:h-11"
        alt="Lavista"
      />
    </div>

    {/* Right */}
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setIsProfileOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-white transition-all duration-200 hover:border-[#c9a35d]/50 hover:bg-white/10"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#f3d79b]">
          <SquareUserRound className="h-5 w-5" />

          <span
            className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#192231] ${
              isOnline ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
        </div>
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 top-full z-50 mt-4 w-[270px] overflow-hidden rounded-2xl border border-white/10 bg-[#192231] shadow-2xl">

          {/* Profile Header */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f3d79b]">
                <SquareUserRound className="h-5 w-5" />

                <span
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#192231] ${
                    isOnline ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "-"}
                </p>

                <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {user?.role || "-"}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  isOnline
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border border-slate-500/30 bg-slate-500/10 text-slate-300"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 px-4 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Last Login
              </p>

              <p className="mt-1 text-sm text-white">
                {formatDateTime(user?.lastLoginAt)}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Last Seen
              </p>

              <p className="mt-1 text-sm text-white">
                {formatDateTime(user?.lastSeenAt)}
              </p>
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition-all duration-200 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>

  </div>
</header>
  );
}
