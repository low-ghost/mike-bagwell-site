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
 *
 * Mobile (<768): always 2-up with %-based widths so columns always fit
 * the live container / device width (orientation, dynamic toolbars, etc.).
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

/** Floor to whole CSS pixels to avoid subpixel horizontal overflow. */
function measureWidth(container: HTMLElement): number {
  const rect = container.getBoundingClientRect().width;
  // Prefer layout width; fall back to rect when clientWidth is 0 (hidden/first paint)
  return Math.max(0, Math.floor(container.clientWidth || rect));
}

export function initPubMasonry(container: HTMLElement, options: MasonryOptions = {}): () => void {
  const minColWidth = options.minColWidth ?? 240;
  const gap = options.gap ?? 24;
  let frame = 0;
  let disposed = false;

  const items = () =>
    Array.from(container.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('pub-card')
    );

  const layout = () => {
    if (disposed) return;
    const cards = items();
    if (cards.length === 0) return;

    const width = measureWidth(container);
    if (width <= 0) {
      // Wait for a real size (flex/grid parent still settling)
      schedule();
      return;
    }

    const isMobile = width < 768;
    const cols = columnCount(width, minColWidth, gap);
    const useGap = isMobile ? Math.min(gap, 12) : gap;
    const heights = Array.from({ length: cols }, () => 0);

    // Keep most of the grid sequential; rebalance only the tail so a tall
    // final cover doesn't leave a dead column beside it.
    const tail = Math.min(cards.length, cols * 2);
    const split = cards.length - tail;

    container.classList.add('pub-masonry--ready');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.maxWidth = '100%';

    const totalGap = useGap * (cols - 1);

    // Mobile: %-based tracks always match the container as it resizes.
    // Desktop: floored px columns for precise multi-col packing.
    const mobileColWidth = `calc((100% - ${totalGap}px) / ${cols})`;
    const desktopColWidth = Math.floor((width - totalGap) / cols);

    cards.forEach((card) => {
      card.style.position = 'absolute';
      card.style.marginBottom = '0';
      card.style.right = 'auto';
      card.style.bottom = 'auto';
      card.style.boxSizing = 'border-box';
      card.style.maxWidth = '100%';
      if (isMobile) {
        card.style.width = mobileColWidth;
      } else {
        card.style.width = `${desktopColWidth}px`;
      }
    });

    const place = (card: HTMLElement, col: number) => {
      if (isMobile) {
        // left = col * (colWidth + gap) expressed in calc so it tracks 100%
        card.style.left =
          col === 0 ? '0px' : `calc(((100% - ${totalGap}px) / ${cols} + ${useGap}px) * ${col})`;
      } else {
        card.style.left = `${col * (desktopColWidth + useGap)}px`;
      }
      card.style.top = `${heights[col]}px`;
      card.style.setProperty('--masonry-col', String(col));
      card.style.setProperty(
        '--masonry-enter-rot',
        isMobile ? (col % 2 === 0 ? '-1.2deg' : '1.2deg') : col % 2 === 0 ? '-2.2deg' : '2.2deg'
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

    container.dispatchEvent(new CustomEvent('pub-masonry:layout', { bubbles: true }));
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

  // iOS dynamic toolbars / orientation: keep columns fitted to the live viewport
  const onViewport = () => schedule();
  window.visualViewport?.addEventListener('resize', onViewport);
  window.visualViewport?.addEventListener('scroll', onViewport);
  window.addEventListener('orientationchange', onViewport);

  schedule();

  // Always paint eventually — never leave the grid invisible if layout stalls
  window.setTimeout(() => {
    if (!disposed) container.classList.add('pub-masonry--ready');
  }, 280);

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    ro.disconnect();
    window.visualViewport?.removeEventListener('resize', onViewport);
    window.visualViewport?.removeEventListener('scroll', onViewport);
    window.removeEventListener('orientationchange', onViewport);
    images.forEach((img) => {
      img.removeEventListener('load', onImg);
      img.removeEventListener('error', onImg);
    });
  };
}
