import { useCallback, useEffect, useState } from 'react';

export interface LightboxImage {
  src: string;
  srcSet?: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
}

export function ImageLightbox({ images }: ImageLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const show = openIndex !== null;
  const current = show ? images[openIndex] : null;

  const go = useCallback(
    (delta: number) => {
      if (openIndex === null || images.length === 0) return;
      setOpenIndex(((openIndex + delta) % images.length + images.length) % images.length);
    },
    [openIndex, images.length]
  );

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [show, close, go]);

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
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              Zoom
            </span>
          </button>
        ))}
      </div>

      {show && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={close}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-2xl leading-none text-white hover:bg-black/70"
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
            className="relative max-h-[90vh] max-w-[min(1100px,96vw)] animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              srcSet={current.srcSet}
              alt={current.alt}
              className="max-h-[82vh] w-auto max-w-full object-contain mx-auto shadow-2xl"
            />
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-white/75">
              <span className="truncate">{current.alt}</span>
              <span className="tabular-nums shrink-0">
                {(openIndex ?? 0) + 1} / {images.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
