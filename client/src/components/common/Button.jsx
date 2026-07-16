export default function Button({
  children,
  className = "",
  variant = "primary",
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  const variants = {
    primary:
      "border border-[#c9a35d]/30 bg-[#192231] text-[#f3d79b] shadow-md hover:bg-[#243146] hover:border-[#c9a35d]/60",

    secondary:
      "border border-slate-200 bg-white text-[#192231] hover:border-[#c9a35d]/40 hover:bg-[#f8f1e6]",

    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-[#192231]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? (
        <Icon className="mr-2 h-4 w-4 shrink-0" />
      ) : null}

      {children}

      {IconRight ? (
        <IconRight className="ml-2 h-4 w-4 shrink-0" />
      ) : null}
    </button>
  );
}