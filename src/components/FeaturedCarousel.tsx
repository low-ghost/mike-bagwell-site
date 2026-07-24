import { useEffect, useState, useCallback, useRef } from 'react';

export interface FeaturedSlide {
  title: string;
  publisher: string;
  url: string;
  pubDate: string;
  excerpt?: string;
  imageSrc: string;
  imageSrcSet?: string;
  imageSizes?: string;
}

interface FeaturedCarouselProps {
  slides: FeaturedSlide[];
}

function normalizeUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export function FeaturedCarousel({ slides }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setInterval(() => go(index + 1), 6500);
    return () => window.clearInterval(id);
  }, [index, paused, count, go]);

  if (count === 0) return null;

  const slide = slides[index];
  const href = normalizeUrl(slide.url);

  return (
    <div
      className="featured-carousel relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      <div className="flex items-end justify-between gap-4 mb-8">
        <h2 className="display-section text-[var(--color-ink)]">
          Featured
        </h2>
        {count > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous featured work"
              className="carousel-nav"
              onClick={() => go(index - 1)}
            >
              ←
            </button>
            <span className="text-sm tabular-nums font-semibold text-[var(--color-mute)] min-w-[3.5rem] text-center">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Next featured work"
              className="carousel-nav"
              onClick={() => go(index + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid md:grid-cols-[minmax(0,380px)_1fr] gap-8 md:gap-12 items-stretch no-underline text-inherit outline-none"
        key={slide.title}
      >
        <div className="relative overflow-hidden rounded-[2px] bg-[var(--color-media)] aspect-[4/5] border border-[var(--color-line)] shadow-[0_28px_50px_-28px_rgba(0,0,0,0.75)]">
          <img
            src={slide.imageSrc}
            srcSet={slide.imageSrcSet}
            sizes={slide.imageSizes || '(max-width: 768px) 90vw, 380px'}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>

        <div className="min-w-0 flex flex-col justify-center py-1 md:py-4 animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-accent-deep)] mb-4">
            {slide.publisher}
            <span className="mx-2 opacity-40">/</span>
            <time dateTime={slide.pubDate}>
              {new Date(slide.pubDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </p>
          <h3 className="font-display text-4xl sm:text-5xl font-normal leading-[1.08] tracking-tight mb-5 text-[var(--color-ink)] group-hover:underline decoration-[var(--color-accent)] decoration-2 underline-offset-4">
            {slide.title}
          </h3>
          {slide.excerpt && (
            <p className="font-poem text-lg sm:text-xl leading-relaxed text-[var(--color-ink-soft)] max-w-2xl">
              {slide.excerpt}
            </p>
          )}
          <span className="mt-8 inline-flex items-center gap-2 text-base font-bold tracking-wide text-[var(--color-ink)]">
            Read
            <span className="transition-transform duration-300 group-hover:translate-x-1 text-[var(--color-accent)]">
              →
            </span>
          </span>
        </div>
      </a>

      {count > 1 && (
        <div className="mt-8 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to featured item ${i + 1}`}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i === index
                  ? 'bg-[var(--color-accent)]'
                  : 'bg-[var(--color-line)] hover:bg-[var(--color-mute)]'
              }`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
