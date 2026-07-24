/**
 * Shortest-column masonry that preserves DOM order (left-to-right, top-to-bottom).
 * Use when CSS multi-column would scramble chronological reading order.
 */

export type MasonryOptions = {
  /** Min column width in px; column count derived from container width */
  minColWidth?: number;
  gap?: number;
};

function columnCount(width: number, minColWidth: number, gap: number): number {
  if (width <= 0) return 1;
  const cols = Math.floor((width + gap) / (minColWidth + gap));
  return Math.max(1, Math.min(4, cols));
}

export function initPubMasonry(
  container: HTMLElement,
  options: MasonryOptions = {}
): () => void {
  const minColWidth = options.minColWidth ?? 240;
  const gap = options.gap ?? 24;
  let frame = 0;
  let disposed = false;

  const items = () =>
    Array.from(container.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );

  const layout = () => {
    if (disposed) return;
    const cards = items();
    if (cards.length === 0) return;

    const width = container.clientWidth;
    const cols = columnCount(width, minColWidth, gap);
    const colWidth = (width - gap * (cols - 1)) / cols;
    const heights = Array.from({ length: cols }, () => 0);

    container.classList.add('pub-masonry--ready');
    container.style.position = 'relative';

    for (const card of cards) {
      card.style.position = 'absolute';
      card.style.width = `${colWidth}px`;
      card.style.marginBottom = '0';
      card.style.right = 'auto';
      card.style.bottom = 'auto';

      const col = heights.indexOf(Math.min(...heights));
      const x = col * (colWidth + gap);
      const y = heights[col];
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      heights[col] += card.offsetHeight + gap;
    }

    container.style.height = `${Math.max(0, ...heights) - (cards.length ? gap : 0)}px`;
  };

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  };

  const images = container.querySelectorAll('img');
  const onImg = () => schedule();
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', onImg);
      img.addEventListener('error', onImg);
    }
  });

  const ro = new ResizeObserver(() => schedule());
  ro.observe(container);

  schedule();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    ro.disconnect();
    images.forEach((img) => {
      img.removeEventListener('load', onImg);
      img.removeEventListener('error', onImg);
    });
  };
}
