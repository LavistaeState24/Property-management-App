export default function Badge({ children, tone = "gold" }) {
  const tones = {
    gold: "border-gold/30 bg-gold/10 text-gold-2",
    green: "border-green/40 bg-green/20 text-emerald-200",
    wine: "border-wine/40 bg-wine/20 text-rose-200",
    slate: "border-white/10 bg-white/5 text-muted",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

