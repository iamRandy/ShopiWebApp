import { Check, CheckCheck, MoreHorizontal, Trash2 } from "lucide-react";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  formatProductPrice,
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
  onQuickDelete,
  isDeleting = false,
  priceAlert,
}) {
  const name = getProductDisplayName(product);
  const price = getFormattedProductPrice(product);
  const displayDescription = getProductDisplayDescription(product);
  const image =
    product.image || "https://via.placeholder.com/80x80?text=No+Image";
  const isFavorite = Boolean(product.isFavorite);
  const previousPriceFormatted = priceAlert
    ? formatProductPrice(priceAlert.previousPrice, product.currency || "$")
    : null;
  const priceRose = priceAlert && Number(product.price) > Number(priceAlert.previousPrice);

  const priceChangeBadge = priceAlert && (
    <span
      title={priceRose ? "Price increased since last check" : "Price dropped since last check"}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black leading-none ${
        priceRose
          ? "bg-amber-400 text-amber-950"
          : "bg-emerald-400 text-emerald-950"
      }`}
    >
      !
    </span>
  );

  const selectButton = ({ alwaysVisible = false } = {}) => (
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
                  : alwaysVisible
                    ? "opacity-100"
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
  );

  const favoriteButton = (buttonClassName) => (
    <FavoriteHeartButton
      isFavorite={isFavorite}
      isLoading={isFavoriteLoading}
      onToggle={(e) => {
        e.stopPropagation();
        if (!isFavoriteLoading) onFavoriteToggle(product, !isFavorite);
      }}
      buttonClassName={buttonClassName}
      iconActiveClassName="h-4 w-4"
      iconInactiveClassName="h-3 w-3"
      ariaLabelOn="Remove favorite"
      ariaLabelOff="Add favorite"
    />
  );

  return (
    <div
      className="group/row cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-white/5"
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
      {/* Mobile layout: stacked info instead of squeezing every grid column into a narrow screen */}
      <div className="flex items-center gap-2.5 px-3 py-3 sm:hidden">
        {selectButton({ alwaysVisible: true })}

        <div className="relative aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
          <ProductImage src={image} alt="" className="h-full w-full" loading="lazy" />
          {favoriteButton("right-1 top-1 h-6 w-6")}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            {previousPriceFormatted && (
              <span className="text-stone-400 line-through dark:text-stone-500">{previousPriceFormatted}</span>
            )}
            <span className="font-medium text-stone-700 dark:text-stone-300">{price}</span>
            {priceChangeBadge}
            <span aria-hidden="true">·</span>
            <span>{formatRelativeAdded(product.savedAt)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onQuickDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDeleting) onQuickDelete(product);
              }}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label="Delete product"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
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
      </div>

      {/* sm+ layout: full column grid */}
      <div className="hidden grid-cols-[4rem_minmax(0,2fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid">
        <div className="flex items-center gap-1.5">
          {selectButton()}

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
          <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
            <ProductImage
              src={image}
              alt=""
              className="h-full w-full transition-transform duration-300 group-hover/row:scale-[1.03]"
              loading="lazy"
            />
            {favoriteButton("right-1 top-1 h-6 w-6")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{name}</p>
            {displayDescription && (
              <p className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">{displayDescription}</p>
            )}
          </div>
        </div>

        <span className="flex min-w-0 items-center gap-1.5 text-sm">
          {previousPriceFormatted && (
            <span className="truncate text-xs text-stone-400 line-through dark:text-stone-500">
              {previousPriceFormatted}
            </span>
          )}
          <span className="truncate font-medium text-stone-800 dark:text-stone-100">{price}</span>
          {priceChangeBadge}
        </span>
        <span className="truncate text-sm text-stone-500 dark:text-stone-400">{product.hostname || "—"}</span>
        <span className="text-sm text-stone-400 dark:text-stone-500">{formatRelativeAdded(product.savedAt)}</span>

        <div className="flex items-center gap-0.5">
          {onQuickDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDeleting) onQuickDelete(product);
              }}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover/row:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label="Delete product"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
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
      </div>
    </div>
  );
}
