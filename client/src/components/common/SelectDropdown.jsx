import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

const SelectDropdown = forwardRef(function SelectDropdown(
  {
    label,
    options = [],
    className = "",
    icon: Icon,
    error,
    placeholder = "Select",
    ...props
  },
  ref,
) {
  return (
    <label className={`flex flex-col gap-1.5 sm:gap-2 ${className}`}>
      <span className="text-sm font-semibold text-body">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        )}

        <select
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-2xl border bg-surface py-2.5 text-sm text-heading outline-none transition-all duration-200 sm:py-3
          ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              : "border-border hover:border-gold/40 focus:border-gold focus:ring-4 focus:ring-gold/10"
          }
          ${Icon ? "pl-10 pr-10" : "px-4 pr-10"}`}
          {...props}
        >
          <option value="" className="text-subtle">
            {placeholder}
          </option>

          {options.map((option, index) => {
            const value =
              typeof option === "string"
                ? option
                : option.value;

            const labelText =
              typeof option === "string"
                ? option
                : option.label;

            return (
              <option
                key={`${value}-${index}`}
                value={value}
              >
                {labelText}
              </option>
            );
          })}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      </div>

      {error && (
        <span className="text-sm text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
});

export default SelectDropdown;