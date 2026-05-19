import { forwardRef } from "react";

const SelectDropdown = forwardRef(function SelectDropdown(
  { label, options = [], className = "", icon: Icon, error, placeholder = "Select", ...props },
  ref
) {
  console.log(`[SelectDropdown] ${label}:`, options.length, options.slice(0, 5));

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold text-md text-muted">{label}</span>

      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        ) : null}

        <select
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-2xl border py-3 text-sm text-ivory outline-none transition ${
            error
              ? "border-rose-400/70 focus:border-rose-400"
              : "border-white/10 bg-ink-2 focus:border-gold/50"
          } ${Icon ? "pl-8 pr-4" : "px-4"}`}
          {...props}
        >
          <option value="">{placeholder}</option>

          {options.map((option, index) => {
            const value = typeof option === "string" ? option : option.value;
            const labelText = typeof option === "string" ? option : option.label;

            return (
              <option key={`${value}-${index}`} value={value}>
                {labelText}
              </option>
            );
          })}
        </select>
      </div>

      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});

export default SelectDropdown;