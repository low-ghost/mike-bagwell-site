/**
 * Sequential column masonry with shortest-column tail fill.
 *
 * Main body: item i → column (i % cols), same as react-responsive-masonry
 * sequential={true}. Preserves L→R date order across the grid.
 *
 * Last `cols * 2` items: placed into the shortest column so the tail
 * fills existing gaps instead of stacking under an already-tall column
 * (the empty-column / towering-last-cover problem at the bottom).
 *
 * Only `.pub-card` children are laid out — Astro island hydration can
 * inject <style>/<script> siblings mid-grid, which would shift columns.
 */

export type MasonryOptions = {
  /** Min column width in px; column count derived from container width */
  minColWidth?: number;
  gap?: number;
};

function columnCount(width: number, minColWidth: number, gap: number): number {
  if (width <= 0) return 2;
  // Phones: always two-up publications
  if (width < 768) return 2;
  const cols = Math.floor((width + gap) / (minColWidth + gap));
  return Math.max(2, Math.min(4, cols));
}

function shortestColumn(heights: number[]): number {
  let col = 0;
  for (let i = 1; i < heights.length; i++) {
    if (heights[i] < heights[col]) col = i;
  }
  return col;
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
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.classList.contains('pub-card')
    );

  const layout = () => {
    if (disposed) return;
    const cards = items();
    if (cards.length === 0) return;

    const width = container.clientWidth;
    const cols = columnCount(width, minColWidth, gap);
    const useGap = width < 768 ? Math.min(gap, 16) : gap;
    const colWidth = (width - useGap * (cols - 1)) / cols;
    const heights = Array.from({ length: cols }, () => 0);

    // Keep most of the grid sequential; rebalance only the tail so a tall
    // final cover doesn't leave a dead column beside it.
    const tail = Math.min(cards.length, cols * 2);
    const split = cards.length - tail;

    container.classList.add('pub-masonry--ready');
    container.style.position = 'relative';

    cards.forEach((card) => {
      card.style.position = 'absolute';
      card.style.width = `${colWidth}px`;
      card.style.marginBottom = '0';
      card.style.right = 'auto';
      card.style.bottom = 'auto';
    });

    const place = (card: HTMLElement, col: number) => {
      const x = col * (colWidth + useGap);
      const y = heights[col];
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.setProperty('--masonry-col', String(col));
      card.style.setProperty(
        '--masonry-enter-rot',
        col % 2 === 0 ? '-2.2deg' : '2.2deg'
      );
      card.dataset.masonryCol = String(col);
      heights[col] += card.offsetHeight + useGap;
    };

    for (let i = 0; i < split; i++) {
      place(cards[i], i % cols);
    }
    for (let i = split; i < cards.length; i++) {
      place(cards[i], shortestColumn(heights));
    }

    container.style.height = `${Math.max(0, ...heights) - (cards.length ? useGap : 0)}px`;

    container.dispatchEvent(
      new CustomEvent('pub-masonry:layout', { bubbles: true })
    );
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

  // Always paint eventually — never leave the grid invisible if layout stalls
  window.setTimeout(() => {
    if (!disposed) container.classList.add('pub-masonry--ready');
  }, 280);

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
