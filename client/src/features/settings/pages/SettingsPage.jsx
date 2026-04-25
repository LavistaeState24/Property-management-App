export default function SettingsPage() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Settings</p>
      <h2 className="mt-2 font-display text-3xl">Workspace configuration</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-muted">
          Manage branding, team access, and role permissions here.
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-muted">
          Extend file storage, WhatsApp integration, and analytics modules next.
        </div>
      </div>
    </div>
  );
}

