import { useCallback, useEffect, useRef, useState } from 'react';

export interface LightboxImage {
  src: string;
  srcSet?: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function ImageLightbox({ images }: ImageLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const swapTimer = useRef<number | null>(null);
  const pendingIndex = useRef<number | null>(null);
  const displayIndexRef = useRef(0);

  displayIndexRef.current = displayIndex;
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setDisplayIndex(openIndex!);
      displayIndexRef.current = openIndex!;
      setSwapping(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [isOpen, openIndex]);

  const commitSwap = useCallback(() => {
    if (pendingIndex.current == null) return;
    const next = pendingIndex.current;
    pendingIndex.current = null;
    setDisplayIndex(next);
    displayIndexRef.current = next;
    setOpenIndex(next);
    requestAnimationFrame(() => setSwapping(false));
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (openIndex === null || images.length === 0) return;
      const current = displayIndexRef.current;
      const next =
        ((current + delta) % images.length + images.length) % images.length;
      if (next === current) return;

      if (prefersReducedMotion()) {
        if (swapTimer.current != null) window.clearTimeout(swapTimer.current);
        pendingIndex.current = null;
        setDisplayIndex(next);
        displayIndexRef.current = next;
        setOpenIndex(next);
        setSwapping(false);
        return;
      }

      pendingIndex.current = next;
      setSwapping(true);
      if (swapTimer.current != null) window.clearTimeout(swapTimer.current);
      swapTimer.current = window.setTimeout(() => commitSwap(), 160);
    },
    [openIndex, images.length, commitSwap]
  );

  useEffect(() => {
    if (!mounted || !visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, visible, close, go]);

  useEffect(() => {
    return () => {
      if (swapTimer.current != null) window.clearTimeout(swapTimer.current);
    };
  }, []);

  const handleShellTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!isOpen && !visible) setMounted(false);
  };

  const current = images[displayIndex];
  const stateClass = visible ? ' is-open' : ' is-closing';

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {images.map((image, i) => (
          <button
            key={`${image.src}-${i}`}
            type="button"
            className="group relative overflow-hidden rounded-[2px] bg-[var(--color-media)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            onClick={() => setOpenIndex(i)}
            aria-label={`View ${image.alt} larger`}
          >
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(max-width: 640px) 100vw, 50vw"
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            <span className="lightbox-zoom">Zoom</span>
          </button>
        ))}
      </div>

      {mounted && current && (
        <div
          className={`lightbox-shell${stateClass}`}
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={close}
          onTransitionEnd={handleShellTransitionEnd}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 carousel-nav !border-white/30 !text-white !bg-black/30 hover:!bg-black/60"
            aria-label="Close gallery"
            onClick={close}
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 carousel-nav !border-white/30 !text-white !bg-black/30 hover:!bg-black/60"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                ←
              </button>
              <button
                type="button"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 carousel-nav !border-white/30 !text-white !bg-black/30 hover:!bg-black/60"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                →
              </button>
            </>
          )}

          <figure
            className="lightbox-figure"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              srcSet={current.srcSet}
              alt={current.alt}
              className={`lightbox-image${swapping ? ' is-swapping' : ''}`}
            />
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-white/75">
              <span className="truncate">{current.alt}</span>
              <span className="tabular-nums shrink-0">
                {displayIndex + 1} / {images.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
