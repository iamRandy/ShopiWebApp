import { GitCompare, LayoutGrid, List, Share2, SlidersHorizontal, Trash2, X } from "lucide-react";
import { formatItemCount } from "../../utils/product";

export default function ProductToolbar({
  title,
  itemCount,
  viewMode,
  onViewModeChange,
  onFilterOpen,
  activeFilterCount = 0,
  canShare = false,
  onShareClick,
  compareCount = 0,
  maxCompare,
  onCompareNow,
  onClearCompare,
  onDeleteSelected,
  isDeletingSelected = false,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">
            {formatItemCount(itemCount)}
          </p>
        </div>

        {canShare && (
          <button
            type="button"
            onClick={onShareClick}
            title="Share cart"
            className="flex ms-2 h-9 items-center gap-1.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-2.5 text-sm font-bold text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5 sm:px-3"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
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

        {onDeleteSelected && compareCount >= 1 && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={isDeletingSelected}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-600 px-3 text-sm font-bold text-white shadow-[3px_3px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-red-900/70"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            {isDeletingSelected
              ? "Deleting…"
              : `Delete ${compareCount} item${compareCount > 1 ? "s" : ""}`}
          </button>
        )}

        <div className="flex overflow-hidden rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] shadow-[3px_3px_0_var(--color-shadow)]">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            className={`flex h-10 w-10 items-center justify-center text-[var(--color-text-primary)] transition-colors ${
              viewMode === "grid" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50 dark:hover:bg-white/5"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            className={`flex h-10 w-10 items-center justify-center border-l-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] transition-colors ${
              viewMode === "list" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50 dark:hover:bg-white/5"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

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
      </div>
    </div>
  );
}
