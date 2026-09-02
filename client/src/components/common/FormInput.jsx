import { forwardRef } from "react";

const FormInput = forwardRef(function FormInput(
  {
    label,
    className = "",
    icon: Icon,
    rightElement,
    error,
    as = "input",
    rows = 4,
    ...props
  },
  ref,
) {
  const { render, ...inputProps } = props;
  void render;

  const sharedClasses = `w-full rounded-2xl border bg-surface py-2.5 text-sm text-heading outline-none transition placeholder:text-subtle sm:py-3
  ${
    error
      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
      : "border-border focus:border-gold focus:ring-4 focus:ring-gold/10"
  }
  ${Icon ? "pl-10" : "pl-4"}
  ${rightElement ? "pr-10" : "pr-4"}`;

  return (
    <label className={`flex flex-col gap-1.5 sm:gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gold sm:text-md">
        {label}
      </span>

      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        ) : null}

        {as === "textarea" ? (
          <textarea
            ref={ref}
            rows={rows}
            aria-invalid={Boolean(error)}
            className={`${sharedClasses} resize-y ${Icon ? "pt-10" : ""}`}
            {...inputProps}
          />
        ) : (
          <input
            ref={ref}
            aria-invalid={Boolean(error)}
            className={sharedClasses}
            {...inputProps}
          />
        )}

        {rightElement ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle">
            {rightElement}
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

export default FormInput;