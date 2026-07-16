import Badge from "./Badge";

export default function StatCard({
  label,
  value,
  accent,
  meta,
  icon: Icon,
}) {
  return (
    <div className="rounded-[28px] border border-border bg-surface p-5 shadow-md transition-all duration-200 ">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-soft text-gold">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}

          <p className="truncate text-sm font-medium text-body">
            {label}
          </p>
        </div>

        {meta ? <Badge tone={accent}>{meta}</Badge> : null}
      </div>

      <p className="mt-4 font-display text-3xl font-semibold text-heading">
        {value}
      </p>
    </div>
  );
}