import { X } from "lucide-react";

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#192231]/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-border bg-surface p-4 shadow-glass sm:rounded-[28px] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
          <h3 className="font-display text-lg font-semibold text-heading sm:text-xl">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-soft text-body transition hover:border-gold/40 hover:bg-gold-soft hover:text-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-body">
          {children}
        </div>
      </div>
    </div>
  );
}