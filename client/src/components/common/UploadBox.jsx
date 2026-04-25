export default function UploadBox({ label, helpText }) {
  return (
    <div className="rounded-3xl border border-dashed border-gold/30 bg-white/5 p-5">
      <p className="text-sm font-medium text-ivory">{label}</p>
      <p className="mt-2 text-sm text-muted">{helpText}</p>
    </div>
  );
}

