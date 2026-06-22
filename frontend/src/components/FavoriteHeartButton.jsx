import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function FavoriteHeartButton({
  isFavorite,
  isLoading = false,
  onToggle,
  buttonClassName = "",
  iconActiveClassName = "h-4 w-4",
  iconInactiveClassName = "h-3.5 w-3.5",
  ariaLabelOn = "Remove from favorites",
  ariaLabelOff = "Add to favorites",
}) {
  const prevIsFavoriteRef = useRef(isFavorite);
  const [isPuffing, setIsPuffing] = useState(false);

  useEffect(() => {
    if (isFavorite && !prevIsFavoriteRef.current) {
      setIsPuffing(true);
    }
    prevIsFavoriteRef.current = isFavorite;
  }, [isFavorite]);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      aria-label={isFavorite ? ariaLabelOn : ariaLabelOff}
      className={`absolute flex items-center justify-center rounded-full bg-white/85 text-[#FFBC42] backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60 ${buttonClassName}`}
    >
      <motion.span
        className="inline-flex"
        animate={isPuffing ? { scale: [1, 1.4, 0.9, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onAnimationComplete={() => setIsPuffing(false)}
      >
        <Heart
          className={`transition-all duration-200 ${isFavorite ? iconActiveClassName : iconInactiveClassName}`}
          fill={isFavorite ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </motion.span>
    </button>
  );
}
