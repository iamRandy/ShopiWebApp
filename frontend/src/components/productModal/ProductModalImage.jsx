export default function ProductModalImage({ src, alt, className = "" }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 ${className}`}
    >
      <img
        src={src || "https://via.placeholder.com/160x160?text=No+Image"}
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
