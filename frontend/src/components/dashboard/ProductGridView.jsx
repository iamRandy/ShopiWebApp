import GridProductCard from "./GridProductCard";

export default function ProductGridView({
  products = [],
  onFavoriteToggle,
  onOpen,
  favoriteLoadingId,
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-8 text-center">
        <p className="text-stone-500">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-6">
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
