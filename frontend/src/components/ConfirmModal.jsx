import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import ModalPortal from "./ModalPortal";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  confirmingLabel,
  cancelLabel = "Cancel",
  danger = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isConfirming) onCancel();
  };

  return (
    <ModalPortal>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm overflow-hidden rounded-t-2xl border border-stone-200 bg-[var(--color-bg-surface)] shadow-xl sm:rounded-2xl dark:border-stone-700"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="px-5 pb-2 pt-5">
            {danger && (
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
              </div>
            )}
            <h2
              id="confirm-modal-title"
              className="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              {title}
            </h2>
            {message && (
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{message}</p>
            )}
          </div>

          <div className="flex gap-2 px-5 pb-5 pt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirming}
              className="flex-1 rounded-xl border border-stone-200 bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                danger
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#FFBC42] text-stone-900 hover:bg-[#f0ad35]"
              }`}
            >
              {isConfirming ? confirmingLabel || confirmLabel : confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
