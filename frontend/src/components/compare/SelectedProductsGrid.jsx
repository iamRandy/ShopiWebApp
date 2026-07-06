import { X } from "lucide-react";
import { getProductDisplayName, truncateProductName } from "../../utils/product";
import ProductImage from "../ProductImage";

function SelectedProductCube({ product, onRemove }) {
  const name = getProductDisplayName(product);
  const image = product.image || "https://via.placeholder.com/240x240?text=No+Image";

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800"
      title={name}
    >
      <ProductImage
        src={image}
        alt={name}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
      <p className="absolute inset-x-0 bottom-0 line-clamp-1 p-2.5 text-xs font-medium text-white">
        {truncateProductName(name)}
      </p>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${name} from comparison`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm transition-transform hover:scale-105"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function SelectedProductsGrid({ products, onRemove, onClear }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
          Selected Products{" "}
          <span className="font-medium text-stone-400 dark:text-stone-500">
            ({products.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-stone-500 hover:underline dark:text-stone-400"
        >
          Clear Comparison
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <SelectedProductCube key={product.id} product={product} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
