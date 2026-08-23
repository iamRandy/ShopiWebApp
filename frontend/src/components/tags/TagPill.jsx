// Shared tag pill — canonical tags render filled, custom tags render outlined/dashed,
// matching the visual language already used by the Chrome extension's TagEditor/TagChips.
export default function TagPill({
  label,
  variant = "canonical",
  onRemove,
  isActive = false,
  onClick,
  className = "",
}) {
  const sizing =
    variant === "compact" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const maxWidth = variant === "compact" ? "max-w-[80px]" : "max-w-[150px]";

  const colors =
    variant === "custom"
      ? "border-2 border-dashed border-[#FFBC42] bg-transparent text-[#FFBC42]"
      : variant === "filter"
        ? isActive
          ? "bg-[#FFBC42] text-black"
          : "border-2 border-stone-300 text-stone-600 hover:border-[#FFBC42] dark:border-stone-600 dark:text-stone-300"
        : "bg-[#FFBC42] text-black";

  const content = (
    <>
      <span className={`truncate ${maxWidth}`}>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove tag: ${label}`}
          className="leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </>
  );

  if (variant === "filter") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isActive}
        className={`inline-flex items-center gap-1 rounded-full font-semibold transition-colors ${sizing} ${colors} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizing} ${colors} ${className}`}
    >
      {content}
    </span>
  );
}
