import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {hasPrev && (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          const isActive = pageNumber === page;
          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={isActive ? "page" : undefined}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isActive
                  ? "bg-[var(--color-text-primary)]"
                  : "bg-stone-300 hover:bg-stone-400 dark:bg-stone-600 dark:hover:bg-stone-500"
              }`}
            />
          );
        })}
      </div>
      {hasNext && (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
