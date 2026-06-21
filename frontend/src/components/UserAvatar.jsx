import { useState } from "react";
import { User } from "lucide-react";

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-16 w-16",
};

export default function UserAvatar({ src, size = "sm", className = "" }) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  if (!src || failed) {
    return (
      <User
        className={`${sizeClass} shrink-0 text-stone-600 dark:text-stone-400 ${className}`}
        strokeWidth={2}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 rounded-full border border-stone-200 object-cover dark:border-stone-700 ${className}`}
    />
  );
}
