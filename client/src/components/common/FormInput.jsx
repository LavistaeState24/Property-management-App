export default function FormInput({ label, className = "", icon: Icon, rightElement, ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold text-md  text-muted">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        ) : null}
        <input
          className={`w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-ivory outline-none transition placeholder:text-muted/60 focus:border-gold/50 focus:bg-white/10 ${
            Icon ? "pl-11" : "pl-4"
          } ${
            rightElement ? "pr-12" : "pr-4"
          }`}
          {...props}
        />
        {rightElement ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            {rightElement}
          </div>
        ) : null}
      </div>
    </label>
  );
}
