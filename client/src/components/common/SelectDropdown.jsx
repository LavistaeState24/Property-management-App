export default function SelectDropdown({ label, options = [], className = "", icon: Icon, ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold text-md text-muted">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        ) : null}
        <select
          className={`w-full rounded-2xl border border-white/10 bg-ink-2 py-3 text-sm text-ivory outline-none transition focus:border-gold/50 ${
            Icon ? "pl-11 pr-4" : "px-4"
          }`}
          {...props}
        >
          <option value="">Select</option>
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const labelText = typeof option === "string" ? option : option.label;

            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
        </select>
      </div>
    </label>
  );
}
