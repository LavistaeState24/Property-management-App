import Badge from "./Badge";

export default function StatCard({ label, value, accent, meta }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <Badge tone={accent}>{meta}</Badge>
      </div>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
    </div>
  );
}

