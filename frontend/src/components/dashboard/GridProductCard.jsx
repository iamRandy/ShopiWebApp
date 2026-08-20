import { Check, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import {
  getProductDisplayName,
  getFormattedProductPrice,
} from "../../utils/product";
import { getAffiliateLink } from "../../utils/affiliate";
import ProductImage from "../ProductImage";
import FavoriteHeartButton from "../FavoriteHeartButton";

export default function GridProductCard({
  product,
  onFavoriteToggle,
  onOpen,
  isFavoriteLoading = false,
  isSelected = false,
  onToggleSelect,
  onSelectAllPage,
  selectDisabled = false,
  onQuickDelete,
  isDeleting = false,
}) {
  const name = getProductDisplayName(product);
  const price = getFormattedProductPrice(product);
  const image =
    product.image || "https://via.placeholder.com/300x300?text=No+Image";
  const isFavorite = Boolean(product.isFavorite);

  const handleVisit = (e) => {
    e.stopPropagation();
    if (product.url) {
      window.open(getAffiliateLink(product.url), "_blank", "noopener,noreferrer");
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (!isFavoriteLoading) {
      onFavoriteToggle(product, !isFavorite);
    }
  };

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    onToggleSelect(product.id);
  };

  const handleSelectAllPage = (e) => {
    e.stopPropagation();
    onSelectAllPage();
  };

  const handleQuickDelete = (e) => {
    e.stopPropagation();
    if (!isDeleting) onQuickDelete(product);
  };

  return (
    <article
      className="group/card relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-stone-100 transition-shadow hover:shadow-md dark:bg-stone-800"
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
      <ProductImage
        src={image}
        alt={name}
        className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover/card:scale-[1.03]"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />

      <div className="absolute left-2.5 top-2.5 flex gap-1.5">
        <div className="group/select relative">
          <button
            type="button"
            onClick={handleToggleSelect}
            disabled={!isSelected && selectDisabled}
            aria-label={isSelected ? "Deselect for comparison" : "Select for comparison"}
            aria-pressed={isSelected}
            className={`flex h-7 w-7 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all ${
              isSelected
                ? "border-[#FFBC42] bg-[#FFBC42] text-black opacity-100"
                : `border-white/80 bg-black/25 text-transparent hover:bg-black/40 ${
                    selectDisabled
                      ? "cursor-not-allowed opacity-0"
                      : "opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
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
            onClick={handleSelectAllPage}
            aria-label="Select all products on this page"
            className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-white/80 bg-black/25 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/40 group-hover/card:opacity-100"
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

      <FavoriteHeartButton
        isFavorite={isFavorite}
        isLoading={isFavoriteLoading}
        onToggle={handleFavorite}
        buttonClassName="right-2.5 top-2.5 h-8 w-8"
        iconActiveClassName="h-[18px] w-[18px]"
        iconInactiveClassName="h-3.5 w-3.5"
        ariaLabelOn="Remove from favorites"
        ariaLabelOff="Add to favorites"
      />

      {onQuickDelete && (
        <button
          type="button"
          onClick={handleQuickDelete}
          disabled={isDeleting}
          aria-label="Delete product"
          className="absolute right-12 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-black/25 text-white opacity-0 backdrop-blur-sm transition-all hover:border-red-400 hover:bg-red-500/85 group-hover/card:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">
          {name}
        </h3>
        {product.hostname && (
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-white/60">
            {product.hostname}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white/95">{price}</p>
          <button
            type="button"
            onClick={handleVisit}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-stone-700 transition-colors hover:bg-white"
            aria-label="Visit product"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
