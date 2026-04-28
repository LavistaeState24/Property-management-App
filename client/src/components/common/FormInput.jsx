import { forwardRef } from "react";

const FormInput = forwardRef(function FormInput(
  { label, className = "", icon: Icon, rightElement, error, ...props },
  ref
) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold text-md text-muted">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        ) : null}
        <input
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-2xl border py-3 text-sm text-ivory outline-none transition placeholder:text-muted/60 focus:bg-white/10 ${
            error ? "border-rose-400/70 focus:border-rose-400" : "border-white/10 bg-white/5 focus:border-gold/50"
          } ${
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
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
});

export default FormInput;
