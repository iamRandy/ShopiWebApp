import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TagPill from "./TagPill";
import TagInput from "./TagInput";

const SCROLL_STEP = 150;

export default function TagCarousel({
  tags = [],
  onAdd,
  onRemove,
  maxTags = 10,
  readOnly = false,
  tagLabelBySlug,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
  }, [tags]);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const atMax = tags.length >= maxTags;

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-SCROLL_STEP)}
          aria-label="Scroll tags left"
          className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tags.map((tag, index) => {
          const label = tagLabelBySlug?.get(tag) || tag;
          const variant = tagLabelBySlug?.has(tag) ? "canonical" : "custom";
          return (
            <TagPill
              key={`${tag}-${index}`}
              label={label}
              variant={variant}
              onRemove={readOnly ? undefined : () => onRemove(tag)}
              className="shrink-0"
            />
          );
        })}

        {!readOnly && !atMax && (
          isAdding ? (
            <TagInput
              onSelect={(value) => {
                onAdd(value);
                setIsAdding(false);
              }}
              onClose={() => setIsAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex shrink-0 items-center gap-0.5 rounded-full border-2 border-dashed border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-500 transition-colors hover:border-[#FFBC42] hover:text-[#FFBC42] dark:border-stone-600 dark:text-stone-400"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              Add tag
            </button>
          )
        )}

        {!readOnly && atMax && (
          <span className="shrink-0 text-xs text-stone-400">Max {maxTags} tags reached</span>
        )}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(SCROLL_STEP)}
          aria-label="Scroll tags right"
          className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
