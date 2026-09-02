import { X } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

const normalizeValue = (value) => (Array.isArray(value) ? value : []);

const MultiSelectDropdown = forwardRef(function MultiSelectDropdown(
  {
    label,
    options = [],
    className = "",
    icon: Icon,
    error,
    placeholder = "Select options",
    value = [],
    onChange,
    onBlur,
    name,
  },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedValues = normalizeValue(value);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleValue = (nextValue) => {
    const nextSelection = selectedValues.includes(nextValue)
      ? selectedValues.filter((item) => item !== nextValue)
      : [...selectedValues, nextValue];

    onChange?.(nextSelection);
  };

  const removeValue = (nextValue) => {
    onChange?.(
      selectedValues.filter((item) => item !== nextValue),
    );
  };

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-semibold text-body">
        {label}
      </span>

      <div ref={containerRef} className="relative">
        <button
          ref={ref}
          type="button"
          name={name}
          aria-invalid={Boolean(error)}
          aria-expanded={isOpen}
          onBlur={onBlur}
          onClick={() => setIsOpen((current) => !current)}
          className={`flex min-h-[48px] w-full flex-wrap items-center gap-2 rounded-2xl border bg-surface py-2 text-left text-sm text-heading outline-none transition
          ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              : "border-border focus:border-gold focus:ring-4 focus:ring-gold/10"
          }
          ${Icon ? "pl-12 pr-4" : "px-4"}`}
        >
          {Icon ? (
            <Icon className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-subtle" />
          ) : null}

          {selectedValues.length ? (
            selectedValues.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold-soft px-3 py-1 text-xs font-semibold text-gold"
              >
                {item}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeValue(item);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      removeValue(item);
                    }
                  }}
                  className="text-[#9a6f2f] transition hover:text-heading"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-subtle">
              {placeholder}
            </span>
          )}
        </button>

        {isOpen ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-glass">
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => {
                const optionValue =
                  typeof option === "string"
                    ? option
                    : option.value;

                const optionLabel =
                  typeof option === "string"
                    ? option
                    : option.label;

                const isSelected =
                  selectedValues.includes(optionValue);

                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() =>
                      toggleValue(optionValue)
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      isSelected
                        ? "bg-gold-soft font-medium text-[#9a6f2f]"
                        : "text-heading hover:bg-surface-soft"
                    }`}
                  >
                    <span>{optionLabel}</span>

                    {isSelected ? (
                      <X className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <span className="text-sm text-rose-600">
          {error}
        </span>
      ) : null}
    </label>
  );
});

export default MultiSelectDropdown;