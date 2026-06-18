import { ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange, hasNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
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
                isActive ? "bg-black" : "bg-stone-300 hover:bg-stone-400"
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
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
