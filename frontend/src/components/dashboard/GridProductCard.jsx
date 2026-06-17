import { Heart, ExternalLink } from "lucide-react";
import {
  getProductDisplayName,
  getFormattedProductPrice,
} from "../../utils/product";
import { getAffiliateLink } from "../../utils/affiliate";

export default function GridProductCard({
  product,
  onFavoriteToggle,
  onOpen,
  isFavoriteLoading = false,
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

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#FFBC42] transition-transform hover:-translate-y-1"
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
      <div className="relative aspect-square bg-stone-100">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          onClick={handleFavorite}
          disabled={isFavoriteLoading}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0_#000] transition-colors ${
            isFavorite ? "text-red-500" : "text-stone-400 hover:text-red-400"
          }`}
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorite ? "currentColor" : "none"}
            strokeWidth={2.25}
          />
        </button>
        {product.hostname && (
          <span className="absolute bottom-2 left-2 rounded-full border border-stone-200 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
            {product.hostname}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-black">
            {name}
          </h3>
          <p className="mt-1 text-sm font-extrabold text-black">{price}</p>
        </div>
        <button
          type="button"
          onClick={handleVisit}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          Visit Product
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </article>
  );
}
