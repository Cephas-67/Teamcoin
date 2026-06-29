import { useEffect, useRef, useState } from "react";

// Observe un élément et bascule `inView` selon sa visibilité.
// Sert à monter / démonter les canvas WebGL coûteux (Silk).
export function useInViewport<T extends Element>(
  rootMargin: string = "200px",
  options: { once?: boolean } = {},
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once) io.disconnect();
        } else if (!options.once) {
          setInView(false);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, options.once]);

  return { ref, inView };
}
