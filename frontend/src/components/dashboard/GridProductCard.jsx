import { Heart, ExternalLink } from "lucide-react";
import {
  getProductDisplayName,
  getFormattedProductPrice,
} from "../../utils/product";
import { getAffiliateLink } from "../../utils/affiliate";
import ProductImage from "../ProductImage";

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
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-stone-100 transition-shadow hover:shadow-md"
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
        className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />

      {product.hostname && (
        <span className="absolute left-2.5 top-2.5 max-w-[calc(100%-3rem)] truncate rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-medium text-stone-600 backdrop-blur-sm">
          {product.hostname}
        </span>
      )}

      <button
        type="button"
        onClick={handleFavorite}
        disabled={isFavoriteLoading}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-[#FFBC42] backdrop-blur-sm transition-colors hover:bg-black/55"
      >
        <Heart
          className={`transition-all duration-200 ${isFavorite ? "h-[18px] w-[18px]" : "h-3.5 w-3.5"}`}
          fill={isFavorite ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">
          {name}
        </h3>
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
