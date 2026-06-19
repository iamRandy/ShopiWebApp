import { useState } from "react";

// Photos within ~15% of square crop fine with object-cover. Anything
// noticeably taller or wider gets letterboxed with object-contain instead,
// so the product isn't cropped out of frame.
const MIN_SQUARE_RATIO = 0.85;
const MAX_SQUARE_RATIO = 1.18;

export default function ProductImage({ src, alt = "", className = "", onLoad, ...imgProps }) {
  const [fit, setFit] = useState("cover");

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      const isSquare = ratio >= MIN_SQUARE_RATIO && ratio <= MAX_SQUARE_RATIO;
      setFit(isSquare ? "cover" : "contain");
    }
    onLoad?.(e);
  };

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
      {...imgProps}
    />
  );
}
