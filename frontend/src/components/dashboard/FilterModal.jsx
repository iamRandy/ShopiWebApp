import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_FILTERS } from "./useProductFilters";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[8px_8px_0_#FFBC42]">
        <div className="flex items-center justify-between border-b-2 border-stone-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-black">Filter products</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-stone-100"
            aria-label="Close filter"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              Keyword
            </span>
            <input
              type="text"
              value={draft.keyword}
              onChange={(e) => setDraft((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Search name, nickname, store..."
              className="w-full rounded-xl border-2 border-stone-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700">
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
                className="w-full rounded-xl border-2 border-stone-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700">
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
                className="w-full rounded-xl border-2 border-stone-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              Store
            </span>
            <input
              type="text"
              list="store-options"
              value={draft.store}
              onChange={(e) => setDraft((prev) => ({ ...prev, store: e.target.value }))}
              placeholder="e.g. amazon.com"
              className="w-full rounded-xl border-2 border-stone-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
            <datalist id="store-options">
              {storeOptions.map((store) => (
                <option key={store} value={store} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="flex gap-2 border-t-2 border-stone-200 px-5 py-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm font-bold shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl border-2 border-black bg-[#FFBC42] px-4 py-2.5 text-sm font-bold shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
