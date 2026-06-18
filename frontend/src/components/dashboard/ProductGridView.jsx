import GridProductCard from "./GridProductCard";

export default function ProductGridView({
  products = [],
  onFavoriteToggle,
  onOpen,
  favoriteLoadingId,
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
        <p className="text-stone-500">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {products.map((product) => (
        <GridProductCard
          key={product.id}
          product={product}
          onFavoriteToggle={onFavoriteToggle}
          onOpen={onOpen}
          isFavoriteLoading={favoriteLoadingId === product.id}
        />
      ))}
    </div>
  );
}
