import { ArrowRightLeft, CheckCheck, GitCompare, SlidersHorizontal, Trash2, X } from "lucide-react";
import TagPill from "../tags/TagPill";
import { formatProductPrice } from "../../utils/product";

export default function ProductToolbar({
  onFilterOpen,
  activeFilterCount = 0,
  filterChips = [],
  onRemoveFilterChip,
  compareCount = 0,
  maxCompare,
  onCompareNow,
  onClearCompare,
  onDeleteSelected,
  isDeletingSelected = false,
  onMoveSelected,
  isMovingSelected = false,
  onSelectAllPage,
  showingCount = 0,
  totalCount = 0,
  cartTotal = 0,
  selectedTotal = null,
}) {
  const hasSelection = compareCount >= 1 && selectedTotal !== null;
  const totalLabel = hasSelection ? "Selected total" : "Cart total";
  const totalDisplay = formatProductPrice(hasSelection ? selectedTotal : cartTotal, "$");
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onFilterOpen}
          className="relative flex h-10 items-center gap-2 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 text-sm font-bold text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
          Filter
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFBC42] text-[10px] font-extrabold text-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filterChips.map((chip) => (
          <TagPill
            key={chip.id}
            label={chip.label}
            onRemove={() => onRemoveFilterChip?.(chip.id)}
          />
        ))}

        {onDeleteSelected && compareCount >= 1 && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={isDeletingSelected}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-600 px-3 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-red-900/70"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">
              {isDeletingSelected
                ? "Deleting…"
                : `Delete ${compareCount} item${compareCount > 1 ? "s" : ""}`}
            </span>
          </button>
        )}

        {onMoveSelected && compareCount >= 1 && (
          <button
            type="button"
            onClick={onMoveSelected}
            disabled={isMovingSelected}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-3 text-sm font-bold text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRightLeft className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">
              {isMovingSelected
                ? "Moving…"
                : `Move ${compareCount} item${compareCount > 1 ? "s" : ""}`}
            </span>
          </button>
        )}

        {onSelectAllPage && compareCount >= 1 && (
          <button
            type="button"
            onClick={onSelectAllPage}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-3 text-sm font-bold text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5 sm:hidden"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2.25} />
            Select All
          </button>
        )}

        {compareCount >= 1 && (
          <button
            type="button"
            onClick={onClearCompare}
            aria-label="Unselect all"
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-3 text-sm font-bold text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">Unselect all</span>
          </button>
        )}

        {compareCount >= 2 && (
          <div className="flex items-center gap-1 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] py-1 pl-3 pr-3 shadow-[3px_3px_0_var(--color-shadow)]">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {compareCount}
              {maxCompare ? (
                <span className="text-stone-400 dark:text-stone-500"> / {maxCompare}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={onCompareNow}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#FFBC42] px-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
            >
              <GitCompare className="h-4 w-4" strokeWidth={2.25} />
              Compare
            </button>
          </div>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-stone-500 dark:text-stone-400">
        <span>
          Showing {showingCount} of {totalCount} item{totalCount === 1 ? "" : "s"}
        </span>
        {totalCount > 0 && totalDisplay !== null && (
          <>
            <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">
              •
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">
              {totalLabel}: {totalDisplay}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
