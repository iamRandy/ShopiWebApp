import { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "../../utils/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const DEBOUNCE_MS = 200;

/** Debounced canonical-tag autocomplete. Enter with no exact match adds the raw text as-is. */
export default function TagInput({ onSelect, onClose, placeholder = "Add a tag...", disabled = false }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      try {
        const response = await authenticatedFetch(
          `${API_URL}/api/tags/suggest?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.tags || []);
        setIsOpen((data.tags || []).length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error("Error fetching tag suggestions:", err);
      }
    }, DEBOUNCE_MS);
  };

  const commit = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      onClose?.();
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        commit(suggestions[highlightedIndex].slug);
      } else {
        commit(value);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-32 rounded-full border-2 border-[#FFBC42] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] outline-none"
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 max-h-40 w-40 overflow-y-auto rounded-lg border-2 border-[#FFBC42] bg-[var(--color-bg-surface)] shadow-lg"
        >
          {suggestions.map((s, index) => (
            <li
              key={s.slug}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={() => commit(s.slug)}
              className={`cursor-pointer truncate px-2.5 py-1 text-xs ${
                index === highlightedIndex
                  ? "bg-[#FFBC42] text-black"
                  : "hover:bg-stone-100 dark:hover:bg-white/5"
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
