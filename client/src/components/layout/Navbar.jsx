import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Control Room</p>
        <h2 className="mt-2 font-display text-2xl text-ivory">Premium property operations</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-ivory">{user?.name}</p>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">{user?.role}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
}

