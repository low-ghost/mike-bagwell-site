const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·/';

/**
 * Hover scramble: briefly randomize characters, then resolve left-to-right.
 * No-ops under reduced motion or coarse pointers.
 */
export function bindScrambleHover(
  el: HTMLElement,
  options: { frames?: number; charset?: string } = {}
): void {
  if (el.dataset.scrambleBound === '1') return;
  if (
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  el.dataset.scrambleBound = '1';
  const original = el.dataset.text || el.textContent || '';
  const frames = options.frames ?? 14;
  const charset = options.charset ?? CHARSET;
  let raf = 0;

  el.addEventListener('mouseenter', () => {
    let frame = 0;
    cancelAnimationFrame(raf);

    const run = () => {
      frame++;
      const progress = Math.min(1, frame / frames);
      el.textContent = original
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i / original.length < progress) return original[i];
          return charset[(Math.random() * charset.length) | 0];
        })
        .join('');
      if (progress < 1) raf = requestAnimationFrame(run);
      else el.textContent = original;
    };

    raf = requestAnimationFrame(run);
  });
}
