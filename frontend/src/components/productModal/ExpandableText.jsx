import { useState } from "react";

export default function ExpandableText({
  text,
  limit,
  className = "",
  as: Component = "p",
}) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const needsTruncate = text.length > limit;
  const display = needsTruncate && !expanded ? `${text.slice(0, limit)}…` : text;

  return (
    <Component className={`break-words leading-relaxed ${className}`}>
      {display}
      {needsTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1 text-sm font-medium text-[#c47f00] hover:underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </Component>
  );
}
