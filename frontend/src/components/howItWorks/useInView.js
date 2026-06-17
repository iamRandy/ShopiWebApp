import { useEffect, useState } from "react";

export function useInView(ref, rootMargin = "100px") {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return inView;
}
