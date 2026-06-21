import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_FILTERS } from "./useProductFilters";
import ModalPortal from "../ModalPortal";

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  storeOptions = [],
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleClear = () => {
    setDraft(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onClose();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={handleBackdropClick}
      >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] shadow-[8px_8px_0_#FFBC42]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-border-subtle)] px-5 py-4">
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">Filter products</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-primary)] hover:bg-stone-100 dark:hover:bg-white/5"
            aria-label="Close filter"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Keyword
            </span>
            <input
              type="text"
              value={draft.keyword}
              onChange={(e) => setDraft((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Search name, nickname, store..."
              className="w-full rounded-xl border-2 border-stone-300 bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)] dark:border-stone-600"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                Min price
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.priceMin}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, priceMin: e.target.value }))
                }
                placeholder="0"
                className="w-full rounded-xl border-2 border-stone-300 bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)] dark:border-stone-600"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                Max price
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.priceMax}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, priceMax: e.target.value }))
                }
                placeholder="Any"
                className="w-full rounded-xl border-2 border-stone-300 bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)] dark:border-stone-600"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Store
            </span>
            <input
              type="text"
              list="store-options"
              value={draft.store}
              onChange={(e) => setDraft((prev) => ({ ...prev, store: e.target.value }))}
              placeholder="e.g. amazon.com"
              className="w-full rounded-xl border-2 border-stone-300 bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)] dark:border-stone-600"
            />
            <datalist id="store-options">
              {storeOptions.map((store) => (
                <option key={store} value={store} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="flex gap-2 border-t-2 border-[var(--color-border-subtle)] px-5 py-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl border-2 border-[var(--color-border-strong)] bg-[#FFBC42] px-4 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
