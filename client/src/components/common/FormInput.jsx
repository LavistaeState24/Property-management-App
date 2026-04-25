export default function FormInput({ label, className = "", ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm text-muted">{label}</span>
      <input
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-muted/60 focus:border-gold/50 focus:bg-white/10"
        {...props}
      />
    </label>
  );
}

