import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { formatItemCount } from "../../utils/product";

export default function ProductToolbar({
  title,
  itemCount,
  viewMode,
  onViewModeChange,
  onFilterOpen,
  activeFilterCount = 0,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-500">
          {formatItemCount(itemCount)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#000]">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            className={`flex h-10 w-10 items-center justify-center text-black transition-colors ${
              viewMode === "grid" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            className={`flex h-10 w-10 items-center justify-center border-l-2 border-black text-black transition-colors ${
              viewMode === "list" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <button
          type="button"
          onClick={onFilterOpen}
          className="relative flex h-10 items-center gap-2 rounded-xl border-2 border-black bg-white px-4 text-sm font-bold text-black shadow-[3px_3px_0_#000] transition-transform hover:-translate-y-0.5"
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
