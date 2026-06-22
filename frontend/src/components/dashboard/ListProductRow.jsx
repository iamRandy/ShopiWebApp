import { MoreHorizontal } from "lucide-react";
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
}) {
  const name = getProductDisplayName(product);
  const price = getFormattedProductPrice(product);
  const displayDescription = getProductDisplayDescription(product);
  const image =
    product.image || "https://via.placeholder.com/80x80?text=No+Image";
  const isFavorite = Boolean(product.isFavorite);

  return (
    <div
      className="group grid grid-cols-[minmax(0,2fr)_minmax(4rem,1fr)_minmax(4rem,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50/80 sm:grid-cols-[minmax(0,2fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto] dark:hover:bg-white/5"
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
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:h-14 sm:w-14 dark:bg-stone-800">
          <ProductImage
            src={image}
            alt=""
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
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
