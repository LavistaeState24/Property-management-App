export default function Badge({ children, tone = "gold" }) {
  const tones = {
    gold:
      "border-gold/25 bg-gold-soft text-gold",

    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    wine:
      "border-rose-200 bg-rose-50 text-rose-700",

    slate:
      "border-border bg-surface-soft text-body",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700",

    rose:
      "border-rose-200 bg-rose-50 text-rose-700",

    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
  };

  const resolvedTone = tones[tone] || tones.slate;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none sm:px-3 sm:py-1.5 sm:text-xs ${resolvedTone}`}
    >
      {children}
    </span>
  );
}