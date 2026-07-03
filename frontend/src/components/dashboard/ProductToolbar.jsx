import { LayoutGrid, List, Share2, SlidersHorizontal } from "lucide-react";
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
