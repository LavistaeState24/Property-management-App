export default function SelectDropdown({ label, options = [], className = "", ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm text-muted">{label}</span>
      <select
        className="rounded-2xl border border-white/10 bg-ink-2 px-4 py-3 text-sm text-ivory outline-none transition focus:border-gold/50"
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
    </label>
  );
}

