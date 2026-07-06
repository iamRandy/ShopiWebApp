import { Check, CheckCheck, MoreHorizontal } from "lucide-react";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  formatRelativeAdded,
  getProductDisplayDescription,
} from "../../utils/product";
import ProductImage from "../ProductImage";
import FavoriteHeartButton from "../FavoriteHeartButton";

export default function ListProductRow({
  product,
  onFavoriteToggle,
  onOpen,
  onMenu,
  isFavoriteLoading = false,
  isSelected = false,
  onToggleSelect,
  onSelectAllPage,
  selectDisabled = false,
}) {
  const name = getProductDisplayName(product);
  const price = getFormattedProductPrice(product);
  const displayDescription = getProductDisplayDescription(product);
  const image =
    product.image || "https://via.placeholder.com/80x80?text=No+Image";
  const isFavorite = Boolean(product.isFavorite);

  return (
    <div
      className="group/row grid grid-cols-[4rem_minmax(0,2fr)_minmax(4rem,1fr)_minmax(4rem,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50/80 sm:grid-cols-[4rem_minmax(0,2fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto] dark:hover:bg-white/5"
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="group/select relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(product.id);
            }}
            disabled={!isSelected && selectDisabled}
            aria-label={isSelected ? "Deselect for comparison" : "Select for comparison"}
            aria-pressed={isSelected}
            className={`flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all ${
              isSelected
                ? "border-[#FFBC42] bg-[#FFBC42] text-black opacity-100"
                : `border-stone-300 bg-white text-transparent hover:border-stone-400 dark:border-stone-600 dark:bg-stone-900 ${
                    selectDisabled
                      ? "cursor-not-allowed opacity-0"
                      : "opacity-0 group-hover/row:opacity-100"
                  }`
            }`}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover/select:opacity-100"
          >
            {!isSelected && selectDisabled ? "Compare limit reached" : "Select"}
          </span>
        </div>

        <div className="group/selectall relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectAllPage();
            }}
            aria-label="Select all products on this page"
            className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-stone-300 bg-white text-stone-500 opacity-0 transition-all hover:border-stone-400 group-hover/row:opacity-100 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-400"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover/selectall:opacity-100"
          >
            Select All
          </span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:h-14 sm:w-14 dark:bg-stone-800">
          <ProductImage
            src={image}
            alt=""
            className="h-full w-full transition-transform duration-300 group-hover/row:scale-[1.03]"
            loading="lazy"
          />
          <FavoriteHeartButton
            isFavorite={isFavorite}
            isLoading={isFavoriteLoading}
            onToggle={(e) => {
              e.stopPropagation();
              if (!isFavoriteLoading) onFavoriteToggle(product, !isFavorite);
            }}
            buttonClassName="right-1 top-1 h-6 w-6"
            iconActiveClassName="h-4 w-4"
            iconInactiveClassName="h-3 w-3"
            ariaLabelOn="Remove favorite"
            ariaLabelOff="Add favorite"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{name}</p>
          {displayDescription && (
            <p className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">{displayDescription}</p>
          )}
        </div>
      </div>

      <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{price}</span>
      <span className="hidden truncate text-sm text-stone-500 sm:inline dark:text-stone-400">{product.hostname || "—"}</span>
      <span className="text-sm text-stone-400 dark:text-stone-500">{formatRelativeAdded(product.savedAt)}</span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMenu(product);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-300"
        aria-label="Product options"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
